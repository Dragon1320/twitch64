// NOTE: pretty sure the only thing thats safe rn are highlighted messages

const base64Regex = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$");
const asciiRegex = new RegExp("^[\x00-\x7F]*$");

const observerConfig = { attributes: false, childList: true, subtree: true };

// a glob var is fine here since youre only gonna be on one stream per tab at once
let currentStream = null;

const globObserverCb = () => {
  const newStream = window.location.href;

  if (currentStream != null && currentStream === newStream) {
    return;
  }

  const chat = document.querySelector(".stream-chat");
  if (chat == null) {
    // wait for next body update
    return;
  }

  // set current stream, no need to look for chat again unless the url changes
  currentStream = window.location.href;
  
  // let the cancer begin!
  chat.firstChild.firstChild.firstChild.textContent = "Base64 Chat";

  const chatObserver = new MutationObserver(chatObserverCb);
  chatObserver.observe(chat, observerConfig);
}

const chatObserverCb = mutationList => {
  const messageNodes = [...mutationList].flatMap(e => e.addedNodes).filter(e => e.length > 0).map(e => e[0]).filter(e => e.className === "chat-line__message");

  // some come out undefined, idk what it is but probs fine to ignore them, im guessing non-text messages
  const messageTextNodes = messageNodes.map(e => [...e.childNodes].find(f => f.className === "text-fragment")).filter(e => e != null);

  for (let messageTextNode of messageTextNodes) {
    handleMessage(messageTextNode);
  }
}

const handleMessage = messageTextNode => {
  let encodingFound = false;
  let words = messageTextNode.textContent.split(" ").map(e => e.trim());

  for (let i = 0; i < words.length; i++) {
    if (!base64Regex.test(words[i])) {
      continue;
    }

    const decoded = atob(words[i]);
    if (!asciiRegex.test(decoded)) {
      continue;
    }
    if (decoded.length <= 3) {
      continue;
    }

    encodingFound = true;
    words[i] = `<abbr title="${words[i]}"><mark>${decoded}</mark></abbr>`;
  }

  if (encodingFound) {
    messageTextNode.innerHTML = `<span class="text-fragment" data-a-target="chat-message-text">${words.join(" ")}</span>`;
  }
};

try {
  const body = document.getElementsByTagName("body")[0];

  // probably a terribly inefficient way to do it but oh well
  const globObserver = new MutationObserver(globObserverCb);
  globObserver.observe(body, observerConfig);
} catch (error) {
  console.error(error);
}
