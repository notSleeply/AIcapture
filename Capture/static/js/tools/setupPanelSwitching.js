/**
 * 初始化面板切换功能
 * 管理侧边栏按钮和对应内容面板的切换显示
 * @returns {void}
 */
export function setupPanelSwitching() {
  const btnConfig = document.getElementById("btnConfig");
  const btnKeyboard = document.getElementById("btnKeyboard");
  const btnAbout = document.getElementById("btnAbout");
  const configBox = document.getElementById("configBox");
  const keyboardBox = document.getElementById("keyboardBox");
  const aboutBox = document.getElementById("aboutBox");

  // 配置按钮点击事件
  btnConfig.addEventListener("click", function () {
    removeAllActive();
    btnConfig.classList.add("active");
    hideAllPanels();
    configBox.classList.add("visible");
  });

  // 快捷键按钮点击事件
  btnKeyboard.addEventListener("click", function () {
    removeAllActive();
    btnKeyboard.classList.add("active");
    hideAllPanels();
    keyboardBox.classList.add("visible");
  });

  // 关于按钮点击事件
  btnAbout.addEventListener("click", function () {
    removeAllActive();
    btnAbout.classList.add("active");
    hideAllPanels();
    aboutBox.classList.add("visible");
  });

  // 辅助函数：移除所有active类
  function removeAllActive() {
    btnConfig.classList.remove("active");
    btnKeyboard.classList.remove("active");
    btnAbout.classList.remove("active");
  }

  // 辅助函数：隐藏所有面板
  function hideAllPanels() {
    configBox.classList.remove("visible");
    keyboardBox.classList.remove("visible");
    aboutBox.classList.remove("visible");
  }

  // 默认显示配置面板
  btnConfig.classList.add("active");
  configBox.classList.add("visible");
}