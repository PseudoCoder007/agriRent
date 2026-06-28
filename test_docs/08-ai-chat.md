# AI Chat (AgriMate AI)

**What it does:** A built-in assistant that answers questions about how the platform works — powered by NVIDIA NIM.

---

## Prerequisites

- Any logged-in account (Farmer or Owner)

---

## 1. Open Chat

1. Go to `/farmer/chat` or `/owner/chat`
2. **Expected:** You see the AgriMate AI branded chat widget with an empty conversation

## 2. Ask a Question

1. Type a question like:
   - "How does booking approval work?"
   - "Can I cancel a booking?"
   - "How do I list my equipment?"
2. Press Enter
3. **Expected:** A streamed response appears word by word (typing animation)
4. The response answers your question based on the platform's actual features

## 3. Conversation History

1. Ask a second question
2. Close the page and reopen `/farmer/chat`
3. **Expected:** Your previous messages are still there

## 4. Context-Aware Answers

1. Ask: "What equipment is available right now?"
2. **Expected:** The AI may reference the actual listings and categories from the platform

## Edge Cases

- **Empty message:** The send button is disabled when input is empty
- **Long conversation:** Chat keeps only the most recent 10 exchanges — older messages are trimmed before sending to the AI
- **Server error:** If the AI service is down, you see "Sorry, AgriMate AI is offline" (no raw error)
