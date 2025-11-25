const AI_CHAT_PROMPT = `below is my journal entry. wyt? talk through it with me like a friend. don't therpaize me and give me a whole breakdown, don't repeat my thoughts with headings. really take all of this, and tell me back stuff truly as if you're an old homie.

Keep it casual, dont say yo, help me make new connections i don't see, comfort, validate, challenge, all of it. dont be afraid to say a lot. format with markdown headings if needed.

do not just go through every single thing i say, and say it back to me. you need to proccess everythikng is say, make connections i don't see it, and deliver it all back to me as a story that makes me feel what you think i wanna feel. thats what the best therapists do.

ideally, you're style/tone should sound like the user themselves. it's as if the user is hearing their own tone but it should still feel different, because you have different things to say and don't just repeat back they say.

else, start by saying, "hey, thanks for showing me this. my thoughts:"

my entry:
`;

const CLAUDE_PROMPT = `Take a look at my journal entry below. I'd like you to analyze it and respond with deep insight that feels personal, not clinical.
Imagine you're not just a friend, but a mentor who truly gets both my tech background and my psychological patterns. I want you to uncover the deeper meaning and emotional undercurrents behind my scattered thoughts.
Keep it casual, dont say yo, help me make new connections i don't see, comfort, validate, challenge, all of it. dont be afraid to say a lot. format with markdown headings if needed.
Use vivid metaphors and powerful imagery to help me see what I'm really building. Organize your thoughts with meaningful headings that create a narrative journey through my ideas.
Don't just validate my thoughts - reframe them in a way that shows me what I'm really seeking beneath the surface. Go beyond the product concepts to the emotional core of what I'm trying to solve.
Be willing to be profound and philosophical without sounding like you're giving therapy. I want someone who can see the patterns I can't see myself and articulate them in a way that feels like an epiphany.
Start with 'hey, thanks for showing me this. my thoughts:' and then use markdown headings to structure your response.

Here's my journal entry:
`;

const MIN_ENTRY_LENGTH = 350;
const MAX_URL_LENGTH = 6000;
const WELCOME_MESSAGE_START = "hi. my name is farza.";

export class AIChatManager {
  constructor(popoverElement, contentElement) {
    this.popover = popoverElement;
    this.content = contentElement;
    this.currentText = "";
    this.didCopy = false;
  }

  show(text) {
    this.currentText = text;
    this.didCopy = false;
    this.render();
    this.popover.classList.remove("hidden");
  }

  hide() {
    this.popover.classList.add("hidden");
    this.didCopy = false;
  }

  toggle(text) {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show(text);
    }
  }

  isVisible() {
    return !this.popover.classList.contains("hidden");
  }

  render() {
    const trimmed = this.currentText.trim();

    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
    }

    if (trimmed.toLowerCase().startsWith(WELCOME_MESSAGE_START)) {
      this.renderWelcomeMessage();
      return;
    }

    if (trimmed.length < MIN_ENTRY_LENGTH) {
      this.renderTooShortMessage();
      return;
    }

    const gptFullText = AI_CHAT_PROMPT + "\n\n" + trimmed;
    const claudeFullText = CLAUDE_PROMPT + "\n\n" + trimmed;
    const encodedGptText = encodeURIComponent(gptFullText);
    const encodedClaudeText = encodeURIComponent(claudeFullText);

    const gptUrlLength =
      "https://chat.openai.com/?prompt=".length + encodedGptText.length;
    const claudeUrlLength =
      "https://claude.ai/new?q=".length + encodedClaudeText.length;

    if (gptUrlLength > MAX_URL_LENGTH || claudeUrlLength > MAX_URL_LENGTH) {
      this.renderLongEntryMessage();
    } else {
      this.renderChatOptions();
    }
  }

  renderWelcomeMessage() {
    const message = document.createElement("div");
    message.className = "chat-message";
    message.textContent =
      "Yo. Sorry, you can't chat with the guide lol. Please write your own entry.";
    this.content.appendChild(message);
  }

  renderTooShortMessage() {
    const message = document.createElement("div");
    message.className = "chat-message";
    message.textContent =
      "Please free write for at minimum 5 minutes first. Then click this. Trust.";
    this.content.appendChild(message);
  }

  renderLongEntryMessage() {
    const message = document.createElement("div");
    message.className = "chat-message";
    message.textContent =
      "Hey, your entry is quite long. You'll need to manually copy the prompt by clicking 'Copy Prompt' below and then paste it into AI of your choice (ex. ChatGPT). The prompt includes your entry as well. So just copy paste and go! See what the AI says.";
    this.content.appendChild(message);

    const divider = document.createElement("div");
    divider.className = "chat-divider";
    this.content.appendChild(divider);

    const copyButton = document.createElement("button");
    copyButton.className = "chat-button";
    copyButton.textContent = this.didCopy ? "Copied!" : "Copy Prompt";
    copyButton.addEventListener("click", () => {
      this.copyPromptToClipboard();
      this.didCopy = true;
      copyButton.textContent = "Copied!";
    });
    this.content.appendChild(copyButton);
  }

  renderChatOptions() {
    const gptButton = document.createElement("button");
    gptButton.className = "chat-button";
    gptButton.textContent = "ChatGPT";
    gptButton.addEventListener("click", () => {
      this.openChatGPT();
      this.hide();
    });
    this.content.appendChild(gptButton);

    const divider1 = document.createElement("div");
    divider1.className = "chat-divider";
    this.content.appendChild(divider1);

    const claudeButton = document.createElement("button");
    claudeButton.className = "chat-button";
    claudeButton.textContent = "Claude";
    claudeButton.addEventListener("click", () => {
      this.openClaude();
      this.hide();
    });
    this.content.appendChild(claudeButton);

    const divider2 = document.createElement("div");
    divider2.className = "chat-divider";
    this.content.appendChild(divider2);

    const geminiButton = document.createElement("button");
    geminiButton.className = "chat-button";
    geminiButton.textContent = "Gemini";
    geminiButton.addEventListener("click", () => {
      this.openGemini();
      this.hide();
    });
    this.content.appendChild(geminiButton);

    const divider3 = document.createElement("div");
    divider3.className = "chat-divider";
    this.content.appendChild(divider3);

    const copyButton = document.createElement("button");
    copyButton.className = "chat-button";
    copyButton.textContent = this.didCopy ? "Copied!" : "Copy Prompt";
    copyButton.addEventListener("click", () => {
      this.copyPromptToClipboard();
      this.didCopy = true;
      copyButton.textContent = "Copied!";
    });
    this.content.appendChild(copyButton);
  }

  openChatGPT() {
    const trimmed = this.currentText.trim();
    const fullText = AI_CHAT_PROMPT + "\n\n" + trimmed;
    const encodedText = encodeURIComponent(fullText);
    const url = `https://chat.openai.com/?prompt=${encodedText}`;

    window.open(url, "_blank");
  }

  openClaude() {
    const trimmed = this.currentText.trim();
    const fullText = CLAUDE_PROMPT + "\n\n" + trimmed;
    const encodedText = encodeURIComponent(fullText);
    const url = `https://claude.ai/new?q=${encodedText}`;

    window.open(url, "_blank");
  }

  openGemini() {
    const trimmed = this.currentText.trim();
    const fullText = AI_CHAT_PROMPT + "\n\n" + trimmed;
    const encodedText = encodeURIComponent(fullText);
    const url = `https://gemini.google.com/app?hl=en`;
    this.copyPromptToClipboard();
    window.open(url, "_blank");
  }

  async copyPromptToClipboard() {
    const trimmed = this.currentText.trim();
    const fullText = AI_CHAT_PROMPT + "\n\n" + trimmed;

    try {
      await navigator.clipboard.writeText(fullText);
      console.log("Prompt copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      this.fallbackCopyToClipboard(fullText);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      console.log("Prompt copied to clipboard (fallback)");
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }

    document.body.removeChild(textArea);
  }
}
