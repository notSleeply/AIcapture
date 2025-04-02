function $(id) { return document.getElementById(id); }
const btnCapture = $('btnCapture');
const btnConfig = $('btnConfig');
const btnKeyboard = $('btnKeyboard');
const btnAbout = $('btnAbout');
const configBox = $('configBox');
const keyboardBox = $('keyboardBox');
const aboutBox = $('aboutBox');
const captureKeyBox = $('captureKeyBox');
const hideKeyBox = $('hideKeyBox');
const showKeyBox = $('showKeyBox');
const quitKeyBox = $('quitKeyBox');
const btnSetCaptureKey = $('btnSetCaptureKey');
const btnDelCaptureKey = $('btnDelCaptureKey');
const btnSetShowKey = $('btnSetShowKey');
const btnDelShowKey = $('btnDelShowKey');
const launchInput = $('launchInput');
const launchLabel = $('launchLabel');
const hideInput = $('hideInput');
const hideLabel = $('hideLabel');
const toolInput = $('toolInput');
const toolLabel = $('toolLabel');
const tipsWrap = $('tipsWrap');
const tipsContent = $('tipsContent');

console.log('测试测试myAPI::', myAPI.version);

// 初始化状态变量
let captureKey = localStorage.captureKey || 'Alt + S';  // 默认为 Alt+S
let showKey = localStorage.showKey || '';

// 保存默认快捷键到localStorage
if (!localStorage.captureKey) {
    localStorage.captureKey = captureKey;
    // 发送到主进程
    ipcRenderer.send('setCaptureKey', captureKey);
}

// 更新UI显示快捷键
function updateShortcutDisplay() {
    if (captureKeyBox) {
        captureKeyBox.innerHTML = captureKey || '无截图快捷键';
    }
    if (showKeyBox) {
        showKeyBox.innerHTML = showKey || '无显示快捷键';
    }
}

// 页面加载完成后显示快捷键
document.addEventListener('DOMContentLoaded', () => {
    updateShortcutDisplay();
});

// 移除active样式
function removeActive() {
	btnConfig.classList.remove('active');
	btnKeyboard.classList.remove('active');
	btnAbout.classList.remove('active');
}

// 隐藏所有窗口
function hideBox() {
	configBox.style.display = "none";
	keyboardBox.style.display = "none";
	aboutBox.style.display = "none";
}

// 截图
let hasClickCut = false;
let hideWindows = +localStorage.hideInput;
btnCapture.addEventListener('click', () => {
	// 防止快速点击截图按钮
	if (hasClickCut) {return;}
	hasClickCut = true;

	myAPI.cutScreen();
}, false);
// 截图完成显示提示弹层
ipcRenderer.on('popup-tips', () => {
	tipsWrap.style.display = 'block';
	tipsContent.innerHTML = '截图已添到剪切板';
	setTimeout(() => {
		tipsWrap.style.display = 'none';
	}, 2000);
});
ipcRenderer.on('has-click-cut', (event, status) => {
	hasClickCut = status;
});

// 配置
btnConfig.addEventListener('click', () => {
	resetKey();
	removeActive();
	hideBox();
	btnConfig.classList.add('active');
	configBox.style.display = "block";
}, false);
launchLabel.addEventListener('click', () => {
	if (launchInput.hasAttribute('checked')) {
		localStorage.launchInput = 0;
	} else {
		localStorage.launchInput = 1;
	}
	ipcRenderer.send('launch', +localStorage.launchInput);
}, false);
// 截图时是否隐藏当前窗口
hideInput.addEventListener('click', () => {
	if (hideInput.hasAttribute('checked')) {
		hideInput.removeAttribute('checked');
		localStorage.hideInput = 0;
	} else {
		hideInput.setAttribute('checked', true);
		localStorage.hideInput = 1;
	}
	ipcRenderer.send('is-hide-windows', +localStorage.hideInput);
	hideWindows = +localStorage.hideInput;
}, false);
hideLabel.addEventListener('click', () => {
	if (hideInput.hasAttribute('checked')) {
		localStorage.hideInput = 0;
	} else {
		localStorage.hideInput = 1;
	}
	ipcRenderer.send('is-hide-windows', +localStorage.hideInput);
	hideWindows = +localStorage.hideInput;
}, false);
// 是否保存截图工具的大小和颜色选择
toolInput.addEventListener('click', () => {
	if (toolInput.hasAttribute('checked')) {
		toolInput.removeAttribute('checked');
		localStorage.toolInput = 0;
	} else {
		toolInput.setAttribute('checked', true);
		localStorage.toolInput = 1;
	}
}, false);
toolLabel.addEventListener('click', () => {
	if (toolInput.hasAttribute('checked')) {
		localStorage.toolInput = 0;
	} else {
		localStorage.toolInput = 1;
	}
}, false);

// 快捷键
// 1代表截图快捷键，2代表显示快捷键
let keyKind = 0;
btnKeyboard.addEventListener('click', () => {
	removeActive();
	hideBox();
	btnKeyboard.classList.add('active');
	keyboardBox.style.display = "block";
}, false);

// 截图快捷键
btnSetCaptureKey.addEventListener('click', () => {
	showKeyBox.style.background = 'transparent';
	showKeyBox.style.color = '#333';
	captureKeyBox.style.background = '#6F9AEF';
	captureKeyBox.style.color = '#fff';
	captureKeyBox.innerHTML = '输入截图快捷键';
	showKeyBox.innerHTML = showKey ? showKey : '无显示快捷键';
	shortKey = '';
	split = '';
	keyKind = 1;
}, false);
btnDelCaptureKey.addEventListener('click', () => {
	captureKeyBox.style.background = 'transparent';
	captureKeyBox.style.color = '#333';
	captureKeyBox.innerHTML = '无截图快捷键';
	captureKey = '';
	keyKind = 0;
	localStorage.captureKey = '';
	ipcRenderer.send('setCaptureKey', captureKey);
}, false);

// 显示快捷键
btnSetShowKey.addEventListener('click', () => {
	captureKeyBox.style.background = 'transparent';
	captureKeyBox.style.color = '#333';
	showKeyBox.style.background = '#6F9AEF';
	showKeyBox.style.color = '#fff';
	showKeyBox.innerHTML = '输入显示快捷键';
	captureKeyBox.innerHTML = captureKey ? captureKey : '无截图快捷键';
	shortKey = '';
	split = '';
	keyKind = 2;
}, false);
btnDelShowKey.addEventListener('click', () => {
	showKeyBox.style.background = 'transparent';
	showKeyBox.style.color = '#333';
	showKeyBox.innerHTML = '无显示快捷键';
	showKey = '';
	keyKind = 0;
	localStorage.showKey = '';
	ipcRenderer.send('setShowKey', showKey);
}, false);

// 重置快捷键
function resetKey() {
	keyKind = 0;
	captureKeyBox.style.background = 'transparent';
	captureKeyBox.style.color = '#333';
	showKeyBox.style.background = 'transparent';
	showKeyBox.style.color = '#333';

	// 使用存储的快捷键或默认值
	const displayCaptureKey = captureKey || 'Alt + S';
	captureKeyBox.innerHTML = displayCaptureKey;
	showKeyBox.innerHTML = showKey || '无显示快捷键';
}

// 添加关于按钮事件
btnAbout.addEventListener('click', () => {
	resetKey();
	removeActive();
	hideBox();
	btnAbout.classList.add('active');
	aboutBox.style.display = "block";
}, false);

// 输入新的快捷键
let shortKey = '';
let split = '';
document.addEventListener('keydown', event => {
	if (keyKind) {
		let code = event.keyCode;
		let keyname = '';

		// 只允许输入Alt、Control、Shift、Command、数字和字母
		if (code < 48 || (code > 57 && code < 65) || (code > 91 && code < 96) || code > 105) {
			if (code != 16 && code != 17 && code != 18) {
				switch (keyKind) {
					case 1:
						captureKeyBox.innerHTML = '输入截图快捷键';
						break;
					case 2:
						showKeyBox.innerHTML = '输入显示快捷键';
						break;
				}
				return alert('快捷键只允许输入Alt、Control、Shift、Command、数字和字母，请重新设置！');
			}
		}

		// if(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
		if (code == 16 || code == 17 || code == 18 || code == 91) {
			keyname = event.key;
			// Mac系统的metaKey键
			if (code == 91) {
				keyname = 'Cmd';
			}
		} else {
			keyname = String.fromCharCode(event.keyCode);
		}

		shortKey += split + keyname;
		split = ' + ';

		switch (keyKind) {
			case 1:
				captureKeyBox.innerHTML = shortKey;
				captureKey = shortKey;
				break;
			case 2:
				showKeyBox.innerHTML = shortKey;
				showKey = shortKey;
				break;
		}
	}
}, false);
document.addEventListener('keyup', event => {
	if (keyKind) {
		captureKeyBox.style.background = 'transparent';
		captureKeyBox.style.color = '#333';
		showKeyBox.style.background = 'transparent';
		showKeyBox.style.color = '#333';
		shortKey = '';
		split = '';
		keyKind = 0;

		// tips
		tipsWrap.style.display = 'block';
		tipsContent.innerHTML = '快捷键保存成功';
		setTimeout(() => {
			tipsWrap.style.display = 'none';
		}, 2000);

		// localStorage
		localStorage.captureKey = captureKey;
		localStorage.showKey = showKey;

		// 和主进程通讯，注册新的快捷键
		ipcRenderer.send('setCaptureKey', captureKey);
		ipcRenderer.send('setShowKey', showKey);
	}
}, false);
