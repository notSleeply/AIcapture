// 原理：使用HTML5 Canvas进行图像选择和编辑，无需请求系统权限
// 获取DOM元素
const mask = document.getElementById('mask');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const screenImg = document.getElementById('screenImg');
const pointBox = document.getElementById('pointBox');
const toolbar = document.getElementById('toolbar');
const canvasSize = document.getElementById('canvasSize');
const coordinateInner = document.getElementById('coordinateInner');
const coordinate = document.getElementById('coordinate');

// 存储截图相关的变量
let initPos = [];  // 截图起始位置
let screenShotData = [];  // 截图数据
let isSelecting = false;  // 是否正在选择区域
let canvasWidth = 0;
let canvasHeight = 0;
const MASK_OPACITY = 0.3;  // 蒙层透明度

// 获取屏幕尺寸
const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;
const ratio = window.devicePixelRatio || 1;

// 初始化Canvas尺寸
canvas.width = screenWidth * ratio;
canvas.height = screenHeight * ratio;
mask.style.width = '100%';
mask.style.height = '100%';

// 历史记录数组（用于撤销操作）
window.historyArr = [];

// 初始化函数
const init = () => {
	console.log(`初始化截图工具, 屏幕尺寸: ${screenWidth}x${screenHeight}, 像素比: ${ratio}`);

	// 设置元素尺寸和样式
	screenImg.style.width = '100%';
	screenImg.style.height = '100%';
	screenImg.style.display = 'none'; // 初始隐藏

	// 填充整个canvas为白色背景
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 创建一个虚拟图像作为示例
	createDemoCanvas();

	// 绑定事件
	bindEvents();
};

// 创建演示用的canvas内容
const createDemoCanvas = () => {
	// 绘制背景
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, "#f5f7fa");
	gradient.addColorStop(1, "#c3cfe2");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// 添加一些演示元素
	// 1. 标题文本
	ctx.font = `bold ${24 * ratio}px Arial`;
	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.fillText('截图工具演示', canvas.width / 2, 80 * ratio);

	// 2. 绘制一些形状
	// 矩形
	ctx.fillStyle = 'rgba(255, 99, 71, 0.7)';
	ctx.fillRect(canvas.width / 4, 150 * ratio, 200 * ratio, 100 * ratio);

	// 圆形
	ctx.beginPath();
	ctx.fillStyle = 'rgba(30, 144, 255, 0.7)';
	ctx.arc(canvas.width * 3 / 4, 200 * ratio, 80 * ratio, 0, 2 * Math.PI);
	ctx.fill();

	// 3. 说明文字
	ctx.font = `${16 * ratio}px Arial`;
	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.fillText('请在此区域拖拽鼠标选择要截取的部分', canvas.width / 2, 350 * ratio);
	ctx.fillText('您也可以上传自己的图片作为截图背景', canvas.width / 2, 380 * ratio);

	// 4. 添加上传图片按钮
	drawUploadButton();

	// 开启选择模式
	isSelecting = true;
};

// 绘制上传按钮
const drawUploadButton = () => {
	// 按钮背景
	ctx.fillStyle = '#4CAF50';
	ctx.fillRect(canvas.width / 2 - 100 * ratio, 420 * ratio, 200 * ratio, 50 * ratio);

	// 按钮文字
	ctx.font = `${18 * ratio}px Arial`;
	ctx.fillStyle = 'white';
	ctx.textAlign = 'center';
	ctx.fillText('上传图片', canvas.width / 2, 452 * ratio);

	// 添加点击事件监听
	canvas.addEventListener('click', (e) => {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// 判断点击是否在按钮区域内
		if (x >= (canvas.width / 2 - 100) / ratio &&
			x <= (canvas.width / 2 + 100) / ratio &&
			y >= 420 && y <= 470) {

			// 创建文件输入元素并触发点击
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = 'image/*';
			input.onchange = handleImageUpload;
			input.click();
		}
	});
};

// 处理图片上传
const handleImageUpload = (event) => {
	const file = event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		const img = new Image();
		img.onload = () => {
			// 重置Canvas
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// 计算居中绘制的位置和尺寸
			const scale = Math.min(
				canvas.width / img.width,
				canvas.height / img.height
			) * 0.9; // 留出边距
			const scaledWidth = img.width * scale;
			const scaledHeight = img.height * scale;
			const x = (canvas.width - scaledWidth) / 2;
			const y = (canvas.height - scaledHeight) / 2;

			// 绘制背景
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// 绘制图片
			ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

			// 准备好后设置为可选择状态
			isSelecting = true;
		};
		img.src = e.target.result;
	};
	reader.readAsDataURL(file);
};

// 绑定事件处理
const bindEvents = () => {
	// 鼠标按下事件 - 开始选择区域
	mask.addEventListener('mousedown', handleMaskMouseDown, false);

	// 工具栏按钮事件
	document.getElementById('rect')?.addEventListener('click', () => activateTool('rect'), false);
	document.getElementById('circle')?.addEventListener('click', () => activateTool('circle'), false);
	document.getElementById('arrow')?.addEventListener('click', () => activateTool('arrow'), false);
	document.getElementById('graffiti')?.addEventListener('click', () => activateTool('graffiti'), false);
	document.getElementById('text')?.addEventListener('click', () => activateTool('text'), false);
	document.getElementById('undo')?.addEventListener('click', handleUndo, false);
	document.getElementById('download')?.addEventListener('click', handleDownload, false);
	document.getElementById('exit')?.addEventListener('click', handleExit, false);
	document.getElementById('copy')?.addEventListener('click', handleCopy, false);

	// 响应窗口大小变化
	window.addEventListener('resize', handleResize, false);
};

// 处理窗口大小变化
const handleResize = () => {
	// 更新屏幕尺寸
	const newScreenWidth = window.innerWidth;
	const newScreenHeight = window.innerHeight;

	// 保存当前绘制的内容
	const imageData = canvas.toDataURL();

	// 调整Canvas尺寸
	canvas.width = newScreenWidth * ratio;
	canvas.height = newScreenHeight * ratio;

	// 恢复内容
	const img = new Image();
	img.onload = () => {
		// 保持图像居中
		const x = (canvas.width - img.width) / 2;
		const y = (canvas.height - img.height) / 2;
		ctx.drawImage(img, x, y);
	};
	img.src = imageData;
};

// 处理遮罩层鼠标按下事件 - 开始选择区域
const handleMaskMouseDown = (e) => {
	if (!isSelecting) return;

	// 记录起始位置
	initPos = [e.clientX, e.clientY];

	// 显示坐标信息
	updateCoordinateInfo(e.clientX, e.clientY);
	coordinate.style.left = (e.clientX + 10) + 'px';
	coordinate.style.top = (e.clientY + 10) + 'px';
	coordinate.style.display = 'block';

	// 创建选择层
	const selectionLayer = document.createElement('canvas');
	selectionLayer.className = 'selection-layer';
	selectionLayer.style.position = 'absolute';
	selectionLayer.style.left = '0';
	selectionLayer.style.top = '0';
	selectionLayer.style.width = '100%';
	selectionLayer.style.height = '100%';
	selectionLayer.style.zIndex = '100';
	selectionLayer.width = canvas.width;
	selectionLayer.height = canvas.height;
	document.body.appendChild(selectionLayer);

	const layerCtx = selectionLayer.getContext('2d');

	// 开始监听鼠标移动和释放
	const handleMouseMove = (e) => {
		const endX = e.clientX;
		const endY = e.clientY;
		const [startX, startY] = initPos;

		// 防止超出屏幕边界
		const boundedEndX = Math.min(Math.max(0, endX), screenWidth);
		const boundedEndY = Math.min(Math.max(0, endY), screenHeight);

		// 计算选择区域
		const rectWidth = boundedEndX - startX;
		const rectHeight = boundedEndY - startY;

		// 更新选择区域数据
		screenShotData = [
			Math.min(startX, boundedEndX),
			Math.min(startY, boundedEndY),
			Math.abs(rectWidth),
			Math.abs(rectHeight)
		];

		// 更新坐标和尺寸信息
		updateCoordinateInfo(boundedEndX, boundedEndY);
		updateCanvasSizeInfo(Math.abs(rectWidth), Math.abs(rectHeight));

		// 清除选择层
		layerCtx.clearRect(0, 0, selectionLayer.width, selectionLayer.height);

		// 绘制半透明遮罩
		layerCtx.fillStyle = `rgba(0, 0, 0, ${MASK_OPACITY})`;
		layerCtx.fillRect(0, 0, selectionLayer.width, selectionLayer.height);

		// 绘制选择区域（清除遮罩）
		layerCtx.globalCompositeOperation = 'destination-out';
		layerCtx.fillStyle = '#000';
		layerCtx.fillRect(
			screenShotData[0] * ratio,
			screenShotData[1] * ratio,
			screenShotData[2] * ratio,
			screenShotData[3] * ratio
		);

		// 绘制选择区域边框
		layerCtx.globalCompositeOperation = 'source-over';
		layerCtx.strokeStyle = '#1e88e5';
		layerCtx.lineWidth = 2 * ratio;
		layerCtx.strokeRect(
			screenShotData[0] * ratio,
			screenShotData[1] * ratio,
			screenShotData[2] * ratio,
			screenShotData[3] * ratio
		);
	};

	const handleMouseUp = () => {
		// 移除鼠标事件监听
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);

		// 删除选择层
		document.body.removeChild(selectionLayer);

		// 隐藏坐标信息
		coordinate.style.display = 'none';

		// 如果选择的区域过小，忽略
		if (screenShotData[2] < 5 || screenShotData[3] < 5) {
			return;
		}

		// 完成选择，准备编辑
		finishSelection();
	};

	document.addEventListener('mousemove', handleMouseMove);
	document.addEventListener('mouseup', handleMouseUp);
};

// 完成选择区域，准备编辑
const finishSelection = () => {
	// 更新全局尺寸变量
	canvasWidth = screenShotData[2];
	canvasHeight = screenShotData[3];

	// 设置截图区域
	pointBox.style.width = canvasWidth + 'px';
	pointBox.style.height = canvasHeight + 'px';
	pointBox.style.left = screenShotData[0] + 'px';
	pointBox.style.top = screenShotData[1] + 'px';
	pointBox.style.display = 'block';

	// 获取选择区域的图像
	const imageData = ctx.getImageData(
		screenShotData[0] * ratio,
		screenShotData[1] * ratio,
		screenShotData[2] * ratio,
		screenShotData[3] * ratio
	);

	// 调整Canvas尺寸为选择区域大小
	const originalCanvas = canvas.width;
	const originalHeight = canvas.height;

	// 保存原始画布内容
	const fullCanvasData = ctx.getImageData(0, 0, originalCanvas, originalHeight);

	// 调整Canvas尺寸
	canvas.width = screenShotData[2] * ratio;
	canvas.height = screenShotData[3] * ratio;
	canvas.style.width = canvasWidth + 'px';
	canvas.style.height = canvasHeight + 'px';
	canvas.style.left = screenShotData[0] + 'px';
	canvas.style.top = screenShotData[1] + 'px';

	// 将选择区域数据放入调整后的Canvas
	ctx.putImageData(imageData, 0, 0);

	// 设置工具栏位置
	positionToolbar();

	// 存储初始状态用于撤销
	saveInitialState();

	// 禁用选择模式
	isSelecting = false;
};

// 设置工具栏位置
const positionToolbar = () => {
	// 工具栏放在选择区域下方，如果空间不足则放在上方
	const toolbarRect = toolbar.getBoundingClientRect();
	const bottomSpace = window.innerHeight - (screenShotData[1] + screenShotData[3]);

	if (bottomSpace >= toolbarRect.height + 10) {
		// 放在下方
		toolbar.style.top = (screenShotData[1] + screenShotData[3] + 10) + 'px';
	} else {
		// 放在上方
		toolbar.style.top = (screenShotData[1] - toolbarRect.height - 10) + 'px';
	}

	// 水平居中
	toolbar.style.left = (screenShotData[0] + screenShotData[2] / 2 - toolbarRect.width / 2) + 'px';
	toolbar.style.display = 'block';
};

// 保存初始状态用于撤销
const saveInitialState = () => {
	window.historyArr = [];
	window.historyArr.push(canvas.toDataURL());
	document.getElementById('undo')?.classList.add('undo-disabled');
};

// 更新坐标信息
const updateCoordinateInfo = (x, y) => {
	coordinateInner.innerText = `X:${x}, Y:${y}`;
};

// 更新Canvas尺寸信息
const updateCanvasSizeInfo = (width, height) => {
	canvasSize.innerText = `${width} × ${height}`;
	canvasSize.style.left = screenShotData[0] + 'px';
	canvasSize.style.top = (screenShotData[1] - 30) + 'px';
	canvasSize.style.display = 'block';
};

// 激活绘图工具
const activateTool = (toolType) => {
	// 移除所有工具的激活状态
	document.getElementById('rect')?.classList.remove('rect-active');
	document.getElementById('circle')?.classList.remove('circle-active');
	document.getElementById('arrow')?.classList.remove('arrow-active');
	document.getElementById('graffiti')?.classList.remove('graffiti-active');
	document.getElementById('text')?.classList.remove('text-active');

	// 激活选择的工具
	document.getElementById(toolType)?.classList.add(`${toolType}-active`);

	// 设置鼠标样式
	switch (toolType) {
		case 'rect':
		case 'circle':
		case 'arrow':
			pointBox.style.cursor = 'crosshair';
			break;
		case 'graffiti':
			pointBox.style.cursor = 'crosshair';
			break;
		case 'text':
			pointBox.style.cursor = 'text';
			break;
	}

	// 绑定相应的事件处理程序
	setupToolEvents(toolType);
};

// 设置工具事件处理
const setupToolEvents = (toolType) => {
	// 移除所有现有工具的事件监听器
	removeAllToolEventListeners();

	// 根据工具类型添加相应的事件监听器
	switch (toolType) {
		case 'rect':
			pointBox.addEventListener('mousedown', handleRectStart, false);
			break;
		case 'circle':
			pointBox.addEventListener('mousedown', handleCircleStart, false);
			break;
		case 'arrow':
			pointBox.addEventListener('mousedown', handleArrowStart, false);
			break;
		case 'graffiti':
			pointBox.addEventListener('mousedown', handleGraffitiStart, false);
			break;
		case 'text':
			pointBox.addEventListener('mousedown', handleTextStart, false);
			break;
	}
};

// 移除所有工具事件监听器
const removeAllToolEventListeners = () => {
	// 矩形工具
	pointBox.removeEventListener('mousedown', handleRectStart, false);
	pointBox.removeEventListener('mousemove', handleRectMove, false);
	pointBox.removeEventListener('mouseup', handleRectEnd, false);

	// 椭圆工具
	pointBox.removeEventListener('mousedown', handleCircleStart, false);
	pointBox.removeEventListener('mousemove', handleCircleMove, false);
	pointBox.removeEventListener('mouseup', handleCircleEnd, false);

	// 箭头工具
	pointBox.removeEventListener('mousedown', handleArrowStart, false);
	pointBox.removeEventListener('mousemove', handleArrowMove, false);
	pointBox.removeEventListener('mouseup', handleArrowEnd, false);

	// 涂鸦工具
	pointBox.removeEventListener('mousedown', handleGraffitiStart, false);
	pointBox.removeEventListener('mousemove', handleGraffitiMove, false);
	pointBox.removeEventListener('mouseup', handleGraffitiEnd, false);

	// 文字工具
	pointBox.removeEventListener('mousedown', handleTextStart, false);

	// 清除文本编辑框
	const textEditor = document.querySelector('.text-editor');
	if (textEditor) {
		textEditor.parentNode.removeChild(textEditor);
	}
};

// 保存当前画布状态用于撤销
const saveCanvasState = () => {
	const imageData = canvas.toDataURL();
	window.historyArr.push(imageData);
	document.getElementById('undo')?.classList.remove('undo-disabled');
};

// 绘制矩形相关函数
let rectStartX, rectStartY;
let savedImageData;

const handleRectStart = (e) => {
	e.preventDefault();
	// 保存当前画布状态
	savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// 获取相对于Canvas的坐标
	const rect = canvas.getBoundingClientRect();
	rectStartX = (e.clientX - rect.left) * ratio;
	rectStartY = (e.clientY - rect.top) * ratio;

	// 添加移动和释放事件监听器
	pointBox.addEventListener('mousemove', handleRectMove, false);
	pointBox.addEventListener('mouseup', handleRectEnd, false);
};

const handleRectMove = (e) => {
	e.preventDefault();

	// 恢复初始状态
	ctx.putImageData(savedImageData, 0, 0);

	// 获取当前位置
	const rect = canvas.getBoundingClientRect();
	const currentX = (e.clientX - rect.left) * ratio;
	const currentY = (e.clientY - rect.top) * ratio;

	// 计算矩形参数
	const width = currentX - rectStartX;
	const height = currentY - rectStartY;

	// 绘制矩形
	ctx.strokeStyle = '#FF0000'; // 红色边框
	ctx.lineWidth = 2 * ratio;
	ctx.strokeRect(
		rectStartX,
		rectStartY,
		width,
		height
	);
};

const handleRectEnd = (e) => {
	e.preventDefault();

	// 移除事件监听器
	pointBox.removeEventListener('mousemove', handleRectMove, false);
	pointBox.removeEventListener('mouseup', handleRectEnd, false);

	// 保存当前状态到历史记录
	saveCanvasState();
};

// 椭圆绘制相关函数
let circleStartX, circleStartY;

const handleCircleStart = (e) => {
	e.preventDefault();
	// 保存当前画布状态
	savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// 获取相对于Canvas的坐标
	const rect = canvas.getBoundingClientRect();
	circleStartX = (e.clientX - rect.left) * ratio;
	circleStartY = (e.clientY - rect.top) * ratio;

	// 添加移动和释放事件监听器
	pointBox.addEventListener('mousemove', handleCircleMove, false);
	pointBox.addEventListener('mouseup', handleCircleEnd, false);
};

const handleCircleMove = (e) => {
	e.preventDefault();

	// 恢复初始状态
	ctx.putImageData(savedImageData, 0, 0);

	// 获取当前位置
	const rect = canvas.getBoundingClientRect();
	const currentX = (e.clientX - rect.left) * ratio;
	const currentY = (e.clientY - rect.top) * ratio;

	// 计算椭圆参数
	const radiusX = Math.abs(currentX - circleStartX) / 2;
	const radiusY = Math.abs(currentY - circleStartY) / 2;
	const centerX = Math.min(circleStartX, currentX) + radiusX;
	const centerY = Math.min(circleStartY, currentY) + radiusY;

	// 绘制椭圆
	ctx.strokeStyle = '#0000FF'; // 蓝色边框
	ctx.lineWidth = 2 * ratio;
	ctx.beginPath();
	ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
	ctx.stroke();
};

const handleCircleEnd = (e) => {
	e.preventDefault();

	// 移除事件监听器
	pointBox.removeEventListener('mousemove', handleCircleMove, false);
	pointBox.removeEventListener('mouseup', handleCircleEnd, false);

	// 保存当前状态到历史记录
	saveCanvasState();
};

// 箭头绘制相关函数
let arrowStartX, arrowStartY;

const handleArrowStart = (e) => {
	e.preventDefault();
	// 保存当前画布状态
	savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	// 获取相对于Canvas的坐标
	const rect = canvas.getBoundingClientRect();
	arrowStartX = (e.clientX - rect.left) * ratio;
	arrowStartY = (e.clientY - rect.top) * ratio;

	// 添加移动和释放事件监听器
	pointBox.addEventListener('mousemove', handleArrowMove, false);
	pointBox.addEventListener('mouseup', handleArrowEnd, false);
};

const handleArrowMove = (e) => {
	e.preventDefault();

	// 恢复初始状态
	ctx.putImageData(savedImageData, 0, 0);

	// 获取当前位置
	const rect = canvas.getBoundingClientRect();
	const currentX = (e.clientX - rect.left) * ratio;
	const currentY = (e.clientY - rect.top) * ratio;

	// 绘制箭头
	drawArrow(arrowStartX, arrowStartY, currentX, currentY);
};

const handleArrowEnd = (e) => {
	e.preventDefault();

	// 移除事件监听器
	pointBox.removeEventListener('mousemove', handleArrowMove, false);
	pointBox.removeEventListener('mouseup', handleArrowEnd, false);

	// 保存当前状态到历史记录
	saveCanvasState();
};

// 绘制箭头函数
const drawArrow = (fromX, fromY, toX, toY) => {
	const headLength = 10 * ratio; // 箭头尖端长度
	const angle = Math.atan2(toY - fromY, toX - fromX);

	// 箭头颜色
	ctx.strokeStyle = '#00FF00'; // 绿色
	ctx.fillStyle = '#00FF00';
	ctx.lineWidth = 2 * ratio;

	// 绘制线条
	ctx.beginPath();
	ctx.moveTo(fromX, fromY);
	ctx.lineTo(toX, toY);
	ctx.stroke();

	// 绘制箭头
	ctx.beginPath();
	ctx.moveTo(toX, toY);
	ctx.lineTo(
		toX - headLength * Math.cos(angle - Math.PI / 6),
		toY - headLength * Math.sin(angle - Math.PI / 6)
	);
	ctx.lineTo(
		toX - headLength * Math.cos(angle + Math.PI / 6),
		toY - headLength * Math.sin(angle + Math.PI / 6)
	);
	ctx.lineTo(toX, toY);
	ctx.fill();
};

// 涂鸦绘制相关函数
let isDrawing = false;

const handleGraffitiStart = (e) => {
	e.preventDefault();

	isDrawing = true;

	// 获取相对于Canvas的坐标
	const rect = canvas.getBoundingClientRect();
	const startX = (e.clientX - rect.left) * ratio;
	const startY = (e.clientY - rect.top) * ratio;

	// 开始绘制路径
	ctx.beginPath();
	ctx.strokeStyle = '#FF6600'; // 橙色
	ctx.lineWidth = 2 * ratio;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.moveTo(startX, startY);

	// 添加移动和释放事件监听器
	pointBox.addEventListener('mousemove', handleGraffitiMove, false);
	pointBox.addEventListener('mouseup', handleGraffitiEnd, false);
};

const handleGraffitiMove = (e) => {
	if (!isDrawing) return;
	e.preventDefault();

	// 获取当前位置
	const rect = canvas.getBoundingClientRect();
	const currentX = (e.clientX - rect.left) * ratio;
	const currentY = (e.clientY - rect.top) * ratio;

	// 继续绘制路径
	ctx.lineTo(currentX, currentY);
	ctx.stroke();
};

const handleGraffitiEnd = (e) => {
	e.preventDefault();

	isDrawing = false;

	// 移除事件监听器
	pointBox.removeEventListener('mousemove', handleGraffitiMove, false);
	pointBox.removeEventListener('mouseup', handleGraffitiEnd, false);

	// 保存当前状态到历史记录
	saveCanvasState();
};

// 文字工具相关函数
const handleTextStart = (e) => {
	e.preventDefault();

	// 创建文本输入框
	const textEditor = document.createElement('div');
	textEditor.className = 'text-editor';
	textEditor.contentEditable = true;
	textEditor.style.position = 'absolute';
	textEditor.style.minWidth = '100px';
	textEditor.style.minHeight = '20px';
	textEditor.style.background = 'transparent';
	textEditor.style.border = '1px dashed #666';
	textEditor.style.padding = '5px';
	textEditor.style.color = '#FF00FF'; // 品红色文字
	textEditor.style.fontFamily = 'Arial, sans-serif';
	textEditor.style.fontSize = '16px';
	textEditor.style.zIndex = '1000';

	// 获取点击位置
	const rect = pointBox.getBoundingClientRect();
	textEditor.style.left = (e.clientX - rect.left) + 'px';
	textEditor.style.top = (e.clientY - rect.top) + 'px';

	// 添加到pointBox
	pointBox.appendChild(textEditor);

	// 设置焦点
	textEditor.focus();

	// 失去焦点时绘制文本到Canvas
	textEditor.addEventListener('blur', function () {
		const text = textEditor.innerText.trim();
		if (text) {
			// 获取相对于Canvas的坐标
			const textRect = textEditor.getBoundingClientRect();
			const canvasRect = canvas.getBoundingClientRect();
			const textX = (textRect.left - canvasRect.left) * ratio;
			const textY = (textRect.top - canvasRect.top) * ratio;

			// 绘制文本
			ctx.font = '16px Arial';
			ctx.fillStyle = '#FF00FF';

			// 处理多行文本
			const lines = text.split('\n');
			lines.forEach((line, index) => {
				ctx.fillText(line, textX, textY + (index * 20 * ratio) + 16 * ratio);
			});

			// 保存当前状态到历史记录
			saveCanvasState();
		}

		// 移除文本编辑框
		pointBox.removeChild(textEditor);
	});

	// 按下回车或Esc键确认
	textEditor.addEventListener('keydown', function (event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			textEditor.blur();
		} else if (event.key === 'Escape') {
			textEditor.innerHTML = '';
			textEditor.blur();
		}
	});
};

// 撤销操作处理
const handleUndo = () => {
	if (window.historyArr.length <= 1) return;

	// 移除最新状态
	window.historyArr.pop();

	// 获取前一个状态
	const prevState = window.historyArr[window.historyArr.length - 1];

	// 恢复到前一个状态
	const img = new Image();
	img.onload = function () {
		// 清空Canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 绘制前一个状态
		ctx.drawImage(img, 0, 0);

		// 如果只剩一个状态，禁用撤销按钮
		if (window.historyArr.length <= 1) {
			document.getElementById('undo')?.classList.add('undo-disabled');
		}
	};
	img.src = prevState;
};

// 下载处理
const handleDownload = () => {
	// 创建下载链接
	const link = document.createElement('a');
	link.download = 'screenshot_' + new Date().getTime() + '.png';
	link.href = canvas.toDataURL();

	// 触发下载
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	// 通知用户
	alert('截图已保存');
};

// 退出处理
const handleExit = () => {
	// 重置状态
	canvas.width = screenWidth * ratio;
	canvas.height = screenHeight * ratio;
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.style.left = '0';
	canvas.style.top = '0';

	// 清除Canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// 隐藏所有UI元素
	pointBox.style.display = 'none';
	toolbar.style.display = 'none';
	canvasSize.style.display = 'none';

	// 重新创建演示Canvas
	createDemoCanvas();

	// 重新启用选择模式
	isSelecting = true;
};

// 复制处理
const handleCopy = () => {
	try {
		// 现代浏览器支持 Clipboard API
		if (navigator.clipboard && navigator.clipboard.write) {
			canvas.toBlob(blob => {
				const item = new ClipboardItem({ 'image/png': blob });
				navigator.clipboard.write([item])
					.then(() => alert('截图已复制到剪贴板'))
					.catch(err => {
						console.error('复制失败:', err);
						alert('复制失败，请手动保存截图');
					});
			});
		} else {
			// 降级处理：提供下载
			handleDownload();
		}
	} catch (error) {
		console.error('复制到剪贴板失败:', error);
		alert('复制失败，请手动保存截图');
	}
};

// 启动初始化
document.addEventListener('DOMContentLoaded', init);