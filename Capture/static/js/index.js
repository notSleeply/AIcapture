import { parseShortcut } from "./tools/parseShortcut.js";
import { initSetting } from "./tools/initSetting.js";

function $(id) {
  return document.getElementById(id);
}
const btnCapture = $("btnCapture");
const btnConfig = $("btnConfig");
const btnKeyboard = $("btnKeyboard");
const btnAbout = $("btnAbout");
const configBox = $("configBox");
const keyboardBox = $("keyboardBox");
const aboutBox = $("aboutBox");
const captureKeyBox = $("captureKeyBox");
const hideKeyBox = $("hideKeyBox");
const showKeyBox = $("showKeyBox");
const quitKeyBox = $("quitKeyBox");
const btnSetCaptureKey = $("btnSetCaptureKey");
const btnDelCaptureKey = $("btnDelCaptureKey");
const btnSetShowKey = $("btnSetShowKey");
const btnDelShowKey = $("btnDelShowKey");
const launchInput = $("launchInput");
const launchLabel = $("launchLabel");
const hideInput = $("hideInput");
const hideLabel = $("hideLabel");
const toolInput = $("toolInput");
const toolLabel = $("toolLabel");
const tipsWrap = $("tipsWrap");
const tipsContent = $("tipsContent");

console.log("测试测试myAPI::", myAPI.version);

// 初始化状态变量
let captureKey = localStorage.captureKey || "Alt + S";
let showKey = localStorage.showKey || "无显示快捷键";
let shortKey = "";
let split = "";
let hasClickCut = false;
let keyKind = 0;
let hideWindows = +localStorage.hideInput;
let enableAIAnalysis = +localStorage.toolInput || 1;

// 保存默认快捷键到localStorage
if (!localStorage.captureKey) {
  localStorage.captureKey = captureKey;
  // 发送到主进程
  ipcRenderer.send("setCaptureKey", captureKey);
}

// 页面加载完成后显示快捷键
document.addEventListener("DOMContentLoaded", () => {
  updateShortcutDisplay();
  // 初始化隐藏窗口设置
  initSetting({
    inputElement: hideInput,
    labelElement: hideLabel,
    storageName: "hideInput",
    ipcEventName: "is-hide-windows",
    defaultValue: 0,
    onUpdate: (value) => {
      hideWindows = value;
    },
  });

  // 初始化AI分析工具设置
  initSetting({
    inputElement: toolInput,
    labelElement: toolLabel,
    storageName: "toolInput",
    ipcEventName: "set-ai-analysis",
    defaultValue: 1,
    onUpdate: (value) => {
      enableAIAnalysis = value;
    },
  });
});

// 更新UI显示快捷键
function updateShortcutDisplay() {
  if (captureKeyBox) {
    captureKeyBox.innerHTML = captureKey;
  }
  if (showKeyBox) {
    showKeyBox.innerHTML = showKey;
  }
}
// 添加面板切换逻辑
document.addEventListener("DOMContentLoaded", function () {
  const btnConfig = document.getElementById("btnConfig");
  const btnKeyboard = document.getElementById("btnKeyboard");
  const configBox = document.getElementById("configBox");
  const keyboardBox = document.getElementById("keyboardBox");

  // 配置按钮点击事件
  btnConfig.addEventListener("click", function () {
    btnConfig.classList.add("active");
    btnKeyboard.classList.remove("active");
    configBox.classList.add("visible");
    keyboardBox.classList.remove("visible");
  });

  // 快捷键按钮点击事件
  btnKeyboard.addEventListener("click", function () {
    btnKeyboard.classList.add("active");
    btnConfig.classList.remove("active");
    keyboardBox.classList.add("visible");
    configBox.classList.remove("visible");
  });

  // 默认显示配置面板
  btnConfig.classList.add("active");
  configBox.classList.add("visible");
  keyboardBox.classList.remove("visible");
});

// 移除active样式
function removeActive() {
  btnConfig.classList.remove("active");
  btnKeyboard.classList.remove("active");
  btnAbout.classList.remove("active");
}

// 隐藏所有窗口
function hideBox() {
  configBox.style.display = "none";
  keyboardBox.style.display = "none";
  aboutBox.style.display = "none";
}

// 截图按钮事件
btnCapture.addEventListener(
  "click",
  () => {
    // 防止快速点击截图按钮
    if (hasClickCut) {
      return;
    }
    hasClickCut = true;

    myAPI.cutScreen();
  },
  false
);
// 截图完成显示提示弹层
ipcRenderer.on("popup-tips", () => {
  tipsWrap.style.display = "block";
  tipsContent.innerHTML = "截图已添到剪切板";
  setTimeout(() => {
    tipsWrap.style.display = "none";
  }, 2000);
});
ipcRenderer.on("has-click-cut", (event, status) => {
  hasClickCut = status;
});

// 配置
btnConfig.addEventListener(
  "click",
  () => {
    resetKey();
    removeActive();
    hideBox();
    btnConfig.classList.add("active");
    configBox.style.display = "block";
  },
  false
);
launchLabel.addEventListener(
  "click",
  () => {
    if (launchInput.hasAttribute("checked")) {
      localStorage.launchInput = 0;
    } else {
      localStorage.launchInput = 1;
    }
    ipcRenderer.send("launch", +localStorage.launchInput);
  },
  false
);

// 快捷键
btnKeyboard.addEventListener(
  "click",
  () => {
    removeActive();
    hideBox();
    btnKeyboard.classList.add("active");
    keyboardBox.style.display = "block";
  },
  false
);

// 截图快捷键
btnSetCaptureKey.addEventListener(
  "click",
  () => {
    showKeyBox.style.background = "transparent";
    showKeyBox.style.color = "#333";
    captureKeyBox.style.background = "#6F9AEF";
    captureKeyBox.style.color = "#fff";
    captureKeyBox.innerHTML = "输入截图快捷键";
    showKeyBox.innerHTML = showKey ? showKey : "无显示快捷键";
    shortKey = "";
    split = "";
    keyKind = 1;
  },
  false
);
btnDelCaptureKey.addEventListener(
  "click",
  () => {
    captureKeyBox.style.background = "transparent";
    captureKeyBox.style.color = "#333";
    captureKeyBox.innerHTML = "无截图快捷键";
    captureKey = "";
    keyKind = 0;
    localStorage.captureKey = "";
    ipcRenderer.send("setCaptureKey", captureKey);
  },
  false
);

// 显示快捷键
btnSetShowKey.addEventListener(
  "click",
  () => {
    captureKeyBox.style.background = "transparent";
    captureKeyBox.style.color = "#333";
    showKeyBox.style.background = "#6F9AEF";
    showKeyBox.style.color = "#fff";
    showKeyBox.innerHTML = "输入显示快捷键";
    captureKeyBox.innerHTML = captureKey ? captureKey : "无截图快捷键";
    shortKey = "";
    split = "";
    keyKind = 2;
  },
  false
);
btnDelShowKey.addEventListener(
  "click",
  () => {
    showKeyBox.style.background = "transparent";
    showKeyBox.style.color = "#333";
    showKeyBox.innerHTML = "无显示快捷键";
    showKey = "";
    keyKind = 0;
    localStorage.showKey = "";
    ipcRenderer.send("setShowKey", showKey);
  },
  false
);

// 重置快捷键
function resetKey() {
  keyKind = 0;
  captureKeyBox.style.background = "transparent";
  captureKeyBox.style.color = "#333";
  showKeyBox.style.background = "transparent";
  showKeyBox.style.color = "#333";

  // 使用存储的快捷键或默认值
  const displayCaptureKey = captureKey || "Alt + S";
  captureKeyBox.innerHTML = displayCaptureKey;
  showKeyBox.innerHTML = showKey || "无显示快捷键";
}

// 添加关于按钮事件
btnAbout.addEventListener(
  "click",
  () => {
    resetKey();
    removeActive();
    hideBox();
    btnAbout.classList.add("active");
    aboutBox.style.display = "block";
  },
  false
);

// 监听键盘事件
document.addEventListener(
  "keydown",
  (event) => {
    if (keyKind) {
      const keyname = parseShortcut(event);
      if (!keyname) {
        alert(
          "快捷键只允许输入Alt、Control、Shift、Command、数字和字母，请重新设置！"
        );
        return;
      }

      shortKey += split + keyname;
      split = " + ";

      if (keyKind === 1) {
        captureKeyBox.innerHTML = shortKey;
        captureKey = shortKey;
      } else if (keyKind === 2) {
        showKeyBox.innerHTML = shortKey;
        showKey = shortKey;
      }
    }
  },
  false
);
