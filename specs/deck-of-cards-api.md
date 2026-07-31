# Deck of Cards API Test Plan

## Application Overview

The Deck of Cards API (https://deckofcardsapi.com/api/) is a free, stateful, unauthenticated REST API that simulates one or more standard 52-card decks of playing cards. Consumers create a deck (optionally shuffled, optionally built from multiple 52-card decks or with jokers), draw cards from it, reshuffle it, create "partial" decks from an explicit list of card codes, and manage named "piles" (e.g. a discard pile or a player's hand) that cards can be added to, listed, drawn from (top/bottom/random), and shuffled. Cards can also be returned from a player's hand or from a pile back into the main deck. All endpoints are simple `GET` requests (though POST is also accepted for parameters) returning JSON. Every deck is identified by an opaque `deck_id` string returned when the deck is created, and that id is threaded through all subsequent calls for that deck's lifetime (decks expire after two weeks of inactivity). Card codes are two-character, case-insensitive strings: a value character (A,2-9,0 for ten,J,Q,K) followed by a suit character (S,D,C,H).

Live probing of the real API (as of testing) established the following behaviors that this plan verifies:
- Successful responses are HTTP 200 with `"success": true` and vary in shape by endpoint (`deck_id`, `remaining`, `shuffled`, `cards`, `piles`, etc.).
- Most "expected" business-logic failures (e.g. drawing more cards than remain, an empty deck, `deck_count=0`) are still returned as HTTP 200 with `"success": false` and an `"error"` message string in the body — NOT a 4xx/5xx status.
- However, an unknown/invalid `deck_id` returns a real HTTP 404 with `{"success": false, "error": "Deck ID does not exist."}`.
- Malformed input that the server cannot parse at all (e.g. a non-numeric `count` parameter, or drawing from a pile name that was never created) causes an actual HTTP 500 server error with an HTML error page body (not JSON) — a notable inconsistency in the API's error handling that this plan explicitly documents.
- The correct endpoint for creating a "partial" deck from specific card codes is `GET /api/deck/new/shuffle/?cards=AS,2S,...` (not `/deck/new/draw/?cards=...`); invalid card codes supplied in that list are silently dropped rather than causing an error.
- `remaining` counts and pile counts update deterministically and can be cross-checked arithmetically across calls (e.g. `deck_count=6` yields `remaining: 312`).

This plan covers deck creation (including shuffle, multi-deck, and jokers variants), partial deck creation, reshuffling (including `remaining=true` partial reshuffles), drawing cards (including boundary/empty-deck cases), pile management (add/list/draw top/bottom/random/shuffle), returning cards to the deck, full end-to-end stateful workflows, and explicit error-handling scenarios for invalid deck ids, malformed parameters, and non-existent piles. Tests should use Playwright's `request` fixture (API testing context) rather than page/browser interactions, since this is a pure REST API with no UI. The base URL is `https://deckofcardsapi.com/api/`.

## Test Scenarios

### 1. Deck Creation

**Seed:** `tests/seed.spec.ts`

#### 1.1. Create a new unshuffled deck (happy path)

**File:** `tests/api/deck-creation/create-new-deck.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON includes a non-empty string "deck_id"
    - expect: Response JSON has "shuffled": false
    - expect: Response JSON has "remaining": 52

#### 1.2. Create a new shuffled deck via /new/shuffle/

**File:** `tests/api/deck-creation/create-shuffled-deck.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON includes a non-empty string "deck_id" different from any previously created deck_id
    - expect: Response JSON has "shuffled": true
    - expect: Response JSON has "remaining": 52

#### 1.3. Create a multi-deck deck using deck_count

**File:** `tests/api/deck-creation/create-multi-deck.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=2
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true and "shuffled": true
    - expect: Response JSON has "remaining": 104 (2 x 52)
  2. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6 (simulating a blackjack shoe)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 312 (6 x 52)

#### 1.4. Create a deck with jokers enabled

**File:** `tests/api/deck-creation/create-deck-with-jokers.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/?jokers_enabled=true
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 54 (52 standard cards + 2 jokers)
  2. As a comparison, send a GET request to https://deckofcardsapi.com/api/deck/new/ without jokers_enabled
    - expect: Response JSON has "remaining": 52, confirming jokers are only added when explicitly requested

#### 1.5. Reject deck_count of zero or negative as invalid input

**File:** `tests/api/deck-creation/invalid-deck-count.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=0
    - expect: Response HTTP status is 200 (not a 4xx error)
    - expect: Response JSON has "success": false
    - expect: Response JSON has an "error" field with message "The min number of Decks is 1."
    - expect: Response JSON does NOT include a deck_id or remaining count
  2. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=-1
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": false
    - expect: Response JSON has the same "The min number of Decks is 1." error message

### 2. Partial Deck Creation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Create a partial deck with explicit valid card codes

**File:** `tests/api/partial-deck/create-partial-deck-valid-codes.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,2S,KS,AD,2D,KD,AC,2C,KC,AH,2H,KH (12 specific cards: all aces, twos, and kings)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "shuffled": true
    - expect: Response JSON has "remaining": 12, matching the count of card codes requested
    - expect: A returned deck_id is present and can be used in subsequent draw calls that only ever return cards from the requested set

#### 2.2. Partial deck card codes are case-insensitive

**File:** `tests/api/partial-deck/case-insensitive-codes.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?cards=as,2c,ac (lowercase card codes)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 3, confirming all 3 lowercase codes were accepted as valid

#### 2.3. Partial deck creation silently ignores invalid codes mixed with valid ones

**File:** `tests/api/partial-deck/mixed-valid-invalid-codes.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?cards=AS,ZZ,2C (one invalid 'ZZ' code mixed with two valid codes)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true (no error is raised for the invalid code)
    - expect: Response JSON has "remaining": 2, confirming the invalid 'ZZ' code was silently dropped and only the 2 valid cards were included

#### 2.4. Partial deck creation with only invalid card codes yields an empty deck

**File:** `tests/api/partial-deck/all-invalid-codes.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?cards=ZZ,XX,QQ (all codes invalid/nonsensical)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 0, confirming an empty deck was created rather than the request being rejected

### 3. Reshuffling Existing Decks

**Seed:** `tests/seed.spec.ts`

#### 3.1. Reshuffle a full deck via its deck_id

**File:** `tests/api/reshuffle/reshuffle-full-deck.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "success": true and "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/shuffle/ using the captured deck_id
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "shuffled": true
    - expect: Response JSON has "remaining": 52 (unchanged, since no cards had been drawn)
    - expect: The same deck_id is echoed back in the response

#### 3.2. Reshuffle only remaining cards using remaining=true

**File:** `tests/api/reshuffle/reshuffle-remaining-only.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=5 to draw 5 cards out of the deck
    - expect: Response has "success": true, 5 cards returned, and "remaining": 47
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/shuffle/?remaining=true
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true and "shuffled": true
    - expect: Response JSON has "remaining": 47, confirming only the 47 cards still in the deck were shuffled and the 5 already-drawn cards were left untouched/not returned to the deck
  4. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=2 to draw 2 more cards
    - expect: Response has "success": true and "remaining": 45, confirming the deck continues to deplete correctly after a partial reshuffle

#### 3.3. Reshuffling an invalid/unknown deck_id returns a 404 error

**File:** `tests/api/reshuffle/reshuffle-invalid-deck-id.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/INVALIDID/shuffle/ using a deck_id that was never created
    - expect: Response HTTP status is 404
    - expect: Response JSON has "success": false
    - expect: Response JSON has an "error" field with the message "Deck ID does not exist."

### 4. Drawing Cards

**Seed:** `tests/seed.spec.ts`

#### 4.1. Draw a specific number of cards from a deck (happy path)

**File:** `tests/api/draw/draw-cards-happy-path.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh 52-card deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=5
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array contains exactly 5 card objects, each with "code", "image", "images" (svg/png), "value", and "suit" fields
    - expect: Response JSON has "remaining": 47 (52 - 5)
    - expect: All 5 returned card codes are unique

#### 4.2. Drawing without a count parameter defaults to one card

**File:** `tests/api/draw/draw-default-count.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/ with no count query parameter
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array contains exactly 1 card
    - expect: Response JSON has "remaining": 51

#### 4.3. Drawing with count=0 returns an empty cards array without depleting the deck

**File:** `tests/api/draw/draw-count-zero.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=0
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array is empty ([])
    - expect: Response JSON has "remaining": 52 (unchanged)

#### 4.4. Drawing more cards than remain in a near-empty deck

**File:** `tests/api/draw/draw-more-than-remaining.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=50 to draw down to only 2 cards left
    - expect: Response has "success": true, 50 cards returned, and "remaining": 2
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=100, requesting far more cards than the 2 remaining
    - expect: Response HTTP status is 200 (not a 4xx error)
    - expect: Response JSON has "success": false
    - expect: Response JSON "cards" array contains exactly the 2 remaining cards (all of what was available), not 100
    - expect: Response JSON has "remaining": 0
    - expect: Response JSON has an "error" field with a message such as "Not enough cards remaining to draw 100 additional"

#### 4.5. Drawing from a fully empty deck

**File:** `tests/api/draw/draw-from-empty-deck.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck, then send https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=52 to draw every card
    - expect: Second response has "success": true and "remaining": 0
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=1 against the now-empty deck
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": false
    - expect: Response JSON "cards" array is empty ([])
    - expect: Response JSON has "remaining": 0
    - expect: Response JSON has an "error" field with a message such as "Not enough cards remaining to draw 1 additional"

#### 4.6. Drawing with a non-numeric count parameter causes a server error

**File:** `tests/api/draw/draw-non-numeric-count.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=abc (non-numeric value)
    - expect: Response HTTP status is 500 (Server Error)
    - expect: Response body is an HTML error page (Content-Type is not JSON), not a JSON success/error object
    - expect: This documents an inconsistency in the API: malformed/unparsable parameters crash with a raw 500 HTML page rather than returning a graceful JSON success:false error like other invalid-input cases

#### 4.7. Drawing from an invalid/unknown deck_id returns a 404 error

**File:** `tests/api/draw/draw-invalid-deck-id.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/INVALIDID/draw/?count=1 using a deck_id that was never created
    - expect: Response HTTP status is 404
    - expect: Response JSON has "success": false
    - expect: Response JSON has an "error" field with the message "Deck ID does not exist."

### 5. Pile Management

**Seed:** `tests/seed.spec.ts`

#### 5.1. Add drawn cards to a new pile (pile auto-created)

**File:** `tests/api/piles/add-to-new-pile.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=4 and capture the 4 returned card codes
    - expect: Response has "success": true, 4 cards returned, and "remaining": 48
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/add/?cards={code1},{code2} using the first two drawn card codes, targeting a pile named 'discard' that has never been used before
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "piles" object contains a "discard" key with "remaining": 2, confirming the pile was auto-created on first use
    - expect: Response JSON top-level "remaining" still reflects the main deck's remaining count (48), separate from the pile

#### 5.2. List the contents of a pile

**File:** `tests/api/piles/list-pile-contents.spec.ts`

**Steps:**
  1. Create a fresh deck, draw 2 cards, and add both to a pile named 'discard' (as in the add-to-pile scenario)
    - expect: Pile 'discard' now has "remaining": 2
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/list/
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "piles.discard.cards" is an array containing exactly the 2 card objects previously added, each with "code", "image", "value", and "suit"
    - expect: Response JSON "piles.discard.remaining" equals 2

#### 5.3. Draw the top card from a pile (default draw order)

**File:** `tests/api/piles/draw-from-pile-top.spec.ts`

**Steps:**
  1. Create a fresh deck, draw 2 cards (codeA, codeB in that order), and add both to a pile named 'discard'
    - expect: Pile 'discard' has "remaining": 2
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/draw/?count=1 (default draw, no /bottom/ or /random/)
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array contains 1 card matching the most recently added card (codeB), confirming default draw pulls from the top/most-recently-added end of the pile
    - expect: Response JSON "piles.discard.remaining" decreases to 1

#### 5.4. Draw the bottom card from a pile

**File:** `tests/api/piles/draw-from-pile-bottom.spec.ts`

**Steps:**
  1. Create a fresh deck, draw 2 cards (codeA, codeB in that order), and add both to a pile named 'discard'
    - expect: Pile 'discard' has "remaining": 2
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/draw/bottom/?count=1
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array contains 1 card matching the first card added to the pile (codeA), confirming /bottom/ draws from the opposite end of the default top draw
    - expect: Response JSON "piles.discard.remaining" decreases to 1

#### 5.5. Draw a random card from a pile

**File:** `tests/api/piles/draw-from-pile-random.spec.ts`

**Steps:**
  1. Create a fresh deck, draw 3 cards, and add all 3 to a pile named 'discard'
    - expect: Pile 'discard' has "remaining": 3
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/draw/random/?count=1
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "cards" array contains exactly 1 card whose code is one of the 3 cards previously added to the pile
    - expect: Response JSON "piles.discard.remaining" decreases to 2

#### 5.6. Shuffle a pile

**File:** `tests/api/piles/shuffle-pile.spec.ts`

**Steps:**
  1. Create a fresh deck, draw 2 cards, and add both to a pile named 'discard'
    - expect: Pile 'discard' has "remaining": 2
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/discard/shuffle/
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON "piles.discard.remaining" is unchanged at 2 (shuffling reorders but does not remove/add cards)

#### 5.7. Drawing from a pile name that has never been created causes a server error

**File:** `tests/api/piles/draw-from-nonexistent-pile.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id (do NOT create any pile on this deck)
    - expect: Response has "success": true
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/nonexistent_pile/draw/?count=1 for a pile that was never added to
    - expect: Response HTTP status is 500 (Server Error)
    - expect: Response body is an HTML error page rather than JSON, documenting that drawing from a pile that doesn't yet exist is not handled gracefully by the API (unlike most other invalid-input cases which return JSON success:false)

#### 5.8. Listing a pile name that doesn't exist returns success without that pile's data

**File:** `tests/api/piles/list-nonexistent-pile.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id, and add at least one card to a real pile named 'discard'
    - expect: Pile 'discard' exists with at least 1 card
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/nonexistent_pile/list/ for a pile name that was never used
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true (no error is raised for a nonexistent pile on /list/, contrasting with the 500 error seen when drawing from a nonexistent pile)
    - expect: Response JSON "piles" object does not contain a "nonexistent_pile" key (only real piles such as 'discard' are present)

### 6. Returning Cards to the Deck

**Seed:** `tests/seed.spec.ts`

#### 6.1. Return all drawn cards to the main deck

**File:** `tests/api/return/return-all-cards.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=5
    - expect: Response has "success": true and "remaining": 47
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/return/ with no cards parameter
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 52, confirming all 5 previously drawn cards were returned to the main deck
  4. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=52 to draw the entire deck
    - expect: Response has "success": true, exactly 52 unique card codes returned, and "remaining": 0, confirming the returned cards were fully reintegrated into the drawable deck

#### 6.2. Return only specific cards to the main deck

**File:** `tests/api/return/return-specific-cards.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/ to create a fresh deck and capture its deck_id
    - expect: Response has "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=3 and capture the 3 returned card codes (codeA, codeB, codeC)
    - expect: Response has "success": true and "remaining": 49
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/return/?cards={codeA} to return only the first drawn card
    - expect: Response HTTP status is 200
    - expect: Response JSON has "success": true
    - expect: Response JSON has "remaining": 50 (49 + 1), confirming only codeA was returned while codeB and codeC remain out of the deck

### 7. End-to-End Stateful Workflows

**Seed:** `tests/seed.spec.ts`

#### 7.1. Full lifecycle: create, shuffle, draw, pile, list, draw from pile, and return

**File:** `tests/api/workflows/full-deck-lifecycle.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/ to create a new shuffled deck and capture its deck_id
    - expect: Response has "success": true, "shuffled": true, "remaining": 52
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=4 and capture the 4 card codes drawn
    - expect: Response has "success": true, 4 cards returned, and "remaining": 48
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/player1/add/?cards={code1},{code2} to add the first 2 drawn cards to a pile named 'player1'
    - expect: Response has "success": true and "piles.player1.remaining": 2
  4. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/player1/list/ to confirm the pile contents
    - expect: Response "piles.player1.cards" contains exactly code1 and code2
  5. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/pile/player1/draw/?count=1 to draw the top card from the pile
    - expect: Response has "success": true, 1 card returned matching the most recently added card, and "piles.player1.remaining": 1
  6. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/return/ to return all cards currently held outside of piles (the remaining 2 originally-drawn cards not in the pile, plus the 1 card just drawn from the pile) back to the main deck
    - expect: Response has "success": true and an increased "remaining" count reflecting the returned cards, while the pile still holds the 1 card that was never returned
    - expect: Send a final https://deckofcardsapi.com/api/deck/{deck_id}/pile/player1/list/ request confirming the pile still shows "remaining": 1

#### 7.2. Multi-deck (deck_count=6) creation, draw, and reshuffle-remaining

**File:** `tests/api/workflows/multi-deck-workflow.spec.ts`

**Steps:**
  1. Send a GET request to https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6 to simulate a 6-deck blackjack shoe and capture its deck_id
    - expect: Response has "success": true, "shuffled": true, and "remaining": 312
  2. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/draw/?count=10
    - expect: Response has "success": true, 10 cards returned, and "remaining": 302
    - expect: Because this is a multi-deck shoe, at least one duplicate card code (e.g. two 'AS') may legitimately appear among the 10 drawn cards or across further draws — verify duplicates are allowed and not treated as an error
  3. Send a GET request to https://deckofcardsapi.com/api/deck/{deck_id}/shuffle/?remaining=true
    - expect: Response has "success": true, "shuffled": true, and "remaining": 302, confirming the 10 already-drawn cards stay out of the reshuffled remainder
