import { parseShortcut } from "./tools/parseShortcut.js";
import { initSetting } from "./tools/initSetting.js";
import { setupPanelSwitching } from "./tools/setupPanelSwitching.js";

function $(id) {
  return document.getElementById(id);
}
const btnCapture = $("btnCapture");
const captureKeyBox = $("captureKeyBox");
const showKeyBox = $("showKeyBox");
const btnSetCaptureKey = $("btnSetCaptureKey");
const btnDelCaptureKey = $("btnDelCaptureKey");
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
  setupPanelSwitching();
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
