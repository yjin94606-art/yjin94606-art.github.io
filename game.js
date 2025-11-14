// 游戏对象和变量
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreElement = document.getElementById('player-score');
const aiScoreElement = document.getElementById('ai-score');
const gameStatusElement = document.getElementById('game-status');

// 游戏状态变量
let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let playerScore = 0;
let aiScore = 0;
let winningScore = 11; // 获胜分数

// 难度设置
let currentDifficulty = 'medium'; // 默认难度：适中

// 不同难度级别的AI参数配置
const difficultySettings = {
    easy: {
        aiSpeed: 4,          // AI球拍移动速度较慢
        reactionTime: 150,   // 反应时间较长（毫秒）
        predictionAccuracy: 0.6, // 预测准确度较低
        maxPredictionSteps: 3,   // 最大预测步数较少
        errorMargin: 15      // 误差范围较大
    },
    medium: {
        aiSpeed: 6,          // AI球拍移动速度中等
        reactionTime: 80,    // 反应时间中等
        predictionAccuracy: 0.8, // 预测准确度较高
        maxPredictionSteps: 5,   // 最大预测步数中等
        errorMargin: 8       // 误差范围中等
    },
    hard: {
        aiSpeed: 10,         // AI球拍移动速度很快
        reactionTime: 30,    // 反应时间很短
        predictionAccuracy: 0.95, // 预测准确度极高
        maxPredictionSteps: 8,   // 最大预测步数较多
        errorMargin: 3       // 误差范围很小
    }
};

// 获取当前难度的设置
function getCurrentDifficultySettings() {
    return difficultySettings[currentDifficulty];
}

// 设置游戏难度
function setDifficulty(difficulty) {
    if (difficultySettings.hasOwnProperty(difficulty)) {
        // 保存旧难度设置
        const oldSettings = getCurrentDifficultySettings();
        
        // 更新当前难度
        currentDifficulty = difficulty;
        
        // 更新按钮的active状态
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${difficulty}-difficulty`).classList.add('active');
        
        // 获取新难度设置
        const newSettings = getCurrentDifficultySettings();
        
        // 显示难度更改提示
        let difficultyText = '';
        switch(difficulty) {
            case 'easy':
                difficultyText = '简单';
                break;
            case 'medium':
                difficultyText = '适中';
                break;
            case 'hard':
                difficultyText = '直面雷霆的威光';
                break;
        }
        
        // 显示难度变更信息
        gameStatusElement.textContent = `难度已更改为: ${difficultyText}`;
        
        // 根据难度设置不同的提示颜色
        if (difficulty === 'easy') {
            gameStatusElement.style.color = '#4ade80';
        } else if (difficulty === 'medium') {
            gameStatusElement.style.color = '#facc15';
        } else if (difficulty === 'hard') {
            gameStatusElement.style.color = '#ef4444';
        }
        
        // 2秒后清除提示
        setTimeout(() => {
            if (!gameOver && !ball.isServing) {
                gameStatusElement.textContent = '';
            } else if (ball.isServing) {
                gameStatusElement.textContent = '准备发球';
                gameStatusElement.style.color = '#3498db';
            }
        }, 2000);
        
        // 如果游戏正在进行，平滑过渡到新的AI速度设置
        if (gameStarted && !gameOver) {
            // 渐进式改变AI速度，避免突变
            const speedDifference = newSettings.aiSpeed - oldSettings.aiSpeed;
            const steps = 10; // 分10步完成过渡
            const stepSize = speedDifference / steps;
            
            let currentStep = 0;
            const transitionInterval = setInterval(() => {
                if (currentStep < steps && !gameOver) {
                    ai.speed += stepSize;
                    currentStep++;
                } else {
                    // 确保最终设置为精确值
                    ai.speed = newSettings.aiSpeed;
                    clearInterval(transitionInterval);
                }
            }, 50); // 每50ms更新一次
        }
    }
}

// 游戏对象
const paddleWidth = 10;
const paddleHeight = 80;
const ballRadius = 8;

// 玩家球拍
const player = {
    x: 20,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 8,
    color: '#3498db'
};

// AI球拍
const ai = {
    x: canvas.width - 30,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 6,
    color: '#e74c3c'
};

// 球
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: ballRadius,
    dx: 4,
    dy: 2,
    color: '#2ecc71',
    isServing: true // 控制球是否在发球状态
};

// 鼠标位置
let mouseY = canvas.height / 2;

// 设备检测 - 增强版，更准确的设备类型判断
const isMobile = () => {
    // 优先检查触摸支持
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // 结合用户代理和屏幕尺寸判断
    const isSmallScreen = window.innerWidth <= 768;
    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return hasTouch && (isSmallScreen || mobileUserAgent);
};

// 存储设备类型
let deviceType = isMobile() ? 'mobile' : 'desktop';
// 跟踪最后一次触摸事件时间戳，避免触摸和鼠标事件冲突
let lastTouchTime = 0;

// 初始化游戏
function initGame() {
    // 重置游戏状态
    resetGame();
    
    // 添加事件监听器，确保桌面和移动端操作互不干扰
    setupEventListeners();
    
    // 难度按钮事件监听器
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const difficulty = this.getAttribute('data-difficulty');
            setDifficulty(difficulty);
        });
    });
    
    // 添加窗口大小变化监听，重新检测设备类型
window.addEventListener('resize', function() {
    const newDeviceType = isMobile() ? 'mobile' : 'desktop';
    if (newDeviceType !== deviceType) {
        deviceType = newDeviceType;
        
        // 更新触摸设置
        touchSettings.sensitivity = deviceType === 'mobile' ? 0.9 : 0.8;
        touchSettings.smoothingFactor = deviceType === 'mobile' ? 0.2 : 0.3;
        touchSettings.minMoveThreshold = deviceType === 'mobile' ? 2 : 3;
        touchSettings.edgeBufferZone = deviceType === 'mobile' ? 15 : 10;
        touchSettings.responseDelay = deviceType === 'mobile' ? 8 : 16;
        
        // 重新设置事件监听器
        setupEventListeners();
    }
    
    // 调整球拍位置以适应新的画布大小
    if (gameStarted && !gameOver && !gamePaused) {
        updatePaddlePosition(mouseY);
    }
});

// 添加方向变化监听（针对移动设备）
window.addEventListener('orientationchange', function() {
    // 延迟执行以确保浏览器已完成方向变化
    setTimeout(() => {
        const newDeviceType = isMobile() ? 'mobile' : 'desktop';
        if (newDeviceType !== deviceType) {
            deviceType = newDeviceType;
            
            // 更新触摸设置
            touchSettings.sensitivity = deviceType === 'mobile' ? 0.9 : 0.8;
            touchSettings.smoothingFactor = deviceType === 'mobile' ? 0.2 : 0.3;
            touchSettings.minMoveThreshold = deviceType === 'mobile' ? 2 : 3;
            touchSettings.edgeBufferZone = deviceType === 'mobile' ? 15 : 10;
            touchSettings.responseDelay = deviceType === 'mobile' ? 8 : 16;
            
            // 重新设置事件监听器
            setupEventListeners();
        }
        
        // 调整球拍位置以适应新的画布大小
        if (gameStarted && !gameOver && !gamePaused) {
            updatePaddlePosition(mouseY);
        }
        
        // 确保游戏状态正确绘制
        draw();
    }, 100);
});
    
    // 应用默认难度设置
    const defaultSettings = getCurrentDifficultySettings();
    ai.speed = defaultSettings.aiSpeed;
    
    // 开始游戏循环
    gameLoop();
}

// 重置游戏
function resetGame() {
    playerScore = 0;
    aiScore = 0;
    updateScore();
    resetBall();
    gameStarted = false;
    gamePaused = false;
    gameOver = false;
    
    // 应用当前难度设置到AI
    const settings = getCurrentDifficultySettings();
    ai.speed = settings.aiSpeed;
    
    gameStatusElement.textContent = '点击开始游戏';
    gameStatusElement.classList.remove('emphasis');
}

// 重置球的位置和状态
function resetBall(playerServes = true) {
    // 确保是玩家发球时，球位于玩家球拍旁边
    if (playerServes) {
        ball.x = player.x + player.width + ball.radius;
        ball.y = player.y + player.height / 2;
    } else {
        // AI发球时，球位于AI球拍旁边，但我们总是让玩家发球更公平
        ball.x = player.x + player.width + ball.radius;
        ball.y = player.y + player.height / 2;
    }
    
    // 设置为发球状态
    ball.isServing = true;
    
    // 重置球速为初始值
    ball.dx = 0;
    ball.dy = 0;
}

// 更新分数显示
function updateScore() {
    playerScoreElement.textContent = playerScore;
    aiScoreElement.textContent = aiScore;
}

// 处理鼠标移动
function handleMouseMove(e) {
    // 如果是从触摸事件触发的鼠标事件，则忽略（防止冲突）
    if (Date.now() - lastTouchTime < 250) return;
    
    const rect = canvas.getBoundingClientRect();
    // 计算鼠标相对于画布的位置
    const mouseYRelative = e.clientY - rect.top;
    mouseY = mouseYRelative; // 更新全局鼠标位置
    
    // 更新球拍位置
    updatePaddlePosition(mouseYRelative);
}

// 触摸操作相关配置 - 增强版
const touchSettings = {
    // 基础设置
    sensitivity: deviceType === 'mobile' ? 0.95 : 0.85, // 移动设备更敏感
    touchAreaExtension: 25,
    smoothingEnabled: true,
    smoothingFactor: deviceType === 'mobile' ? 0.15 : 0.3, // 移动设备更流畅
    minMoveThreshold: deviceType === 'mobile' ? 1 : 3, // 移动设备更小的移动阈值
    edgeBufferZone: deviceType === 'mobile' ? 20 : 10,
    responseDelay: deviceType === 'mobile' ? 4 : 16,
    
    // 高级设置 - 新增
    velocityBased: true, // 启用基于速度的响应
    maxVelocityFactor: 1.5, // 最大速度倍增因子
    accelerationSensitivity: 0.1, // 加速度灵敏度
    edgeSlowdownFactor: 0.7, // 边缘区域减速因子
    touchHoldThreshold: 100, // 触摸保持检测阈值（毫秒）
    visualFeedback: true, // 启用视觉反馈
    feedbackDuration: 200 // 反馈持续时间（毫秒）
};

// 触摸速度和加速度跟踪 - 新增
let touchVelocity = 0;
let lastTouchTimestamp = 0;
let touchAcceleration = 0;
let isHighVelocity = false;
let isNearEdge = false;

// 记录上一次触摸位置，用于实现平滑移动
let lastTouchY = null;
// 记录上一次有效的触摸位置
let lastValidTouchY = null;
// 记录触摸开始时间，用于区分点击和滑动
let touchStartTime = 0;
// 记录触摸开始位置
let touchStartY = 0;
// 是否为点击操作标志
let isTapOperation = false;
// 触摸保持相关 - 新增
let touchHoldTimer = null;
let touchFeedbackActive = false;

// 处理触摸开始
function handleTouchStart(e) {
    // 始终阻止默认行为，确保触摸只影响游戏而不影响网页滚动
    e.preventDefault();
    
    // 更新最后触摸时间戳
    lastTouchTime = Date.now();
    
    // 记录触摸开始时间和位置
    touchStartTime = Date.now();
    const touches = e.touches;
    if (touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        touchStartY = touches[0].clientY - rect.top;
        lastValidTouchY = touchStartY;
        
        // 默认假设是点击操作
        isTapOperation = true;
        
        // 保存最后触摸位置
        lastTouchY = touchStartY;
        // 更新鼠标位置（用于球拍移动）
        mouseY = touchStartY;
        
        // 快速响应，不等待其他处理
        requestAnimationFrame(() => {
            // 更新球拍位置
            updatePaddlePosition(touchStartY);
            
            // 如果球在发球状态，可以直接触发发球
            if (ball.isServing && gameStarted) {
                const touchX = touches[0].clientX - rect.left;
                serveBall(touchX, touchStartY);
            }
        });
    }
}

// 处理触摸移动 - 增强版
function handleTouchMove(e) {
    // 始终阻止默认行为，确保触摸滑动只控制球拍而不滚动网页
    e.preventDefault();
    
    // 更新最后触摸时间戳
    lastTouchTime = Date.now();
    const currentTimestamp = lastTouchTime;
    
    if (gameOver) return;
    
    // 获取触摸位置
    const touches = e.touches;
    if (!touches || touches.length === 0) return;
    
    // 计算触摸位置相对于画布的坐标
    const rect = canvas.getBoundingClientRect();
    const touchY = touches[0].clientY - rect.top;
    
    // 计算移动距离，如果超过阈值则标记为非点击操作
    const moveDistance = Math.abs(touchY - touchStartY);
    if (moveDistance > touchSettings.minMoveThreshold) {
        isTapOperation = false;
    }
    
    // 清除触摸保持计时器
    if (touchHoldTimer) {
        clearTimeout(touchHoldTimer);
        touchHoldTimer = null;
    }
    
    // 计算触摸速度和加速度 - 新增
    if (touchSettings.velocityBased && lastTouchTimestamp > 0 && lastTouchY !== null) {
        const timeDelta = currentTimestamp - lastTouchTimestamp;
        const distanceDelta = Math.abs(touchY - lastTouchY);
        
        if (timeDelta > 0 && distanceDelta > 0) {
            // 计算速度（像素/毫秒）
            const newVelocity = distanceDelta / timeDelta;
            // 平滑速度变化
            touchVelocity = touchVelocity * 0.7 + newVelocity * 0.3;
            // 检测高速度移动
            isHighVelocity = touchVelocity > 0.5;
            // 计算加速度
            touchAcceleration = newVelocity - touchVelocity;
        }
    }
    lastTouchTimestamp = currentTimestamp;
    
    // 更新最后触摸位置
    lastTouchY = touchY;
    
    // 检查是否接近边缘 - 新增
    isNearEdge = touchY < touchSettings.edgeBufferZone * 2 || 
                touchY > canvas.height - touchSettings.edgeBufferZone * 2;
    
    // 实现精确的触摸位置映射到球拍位置
    // 1. 应用屏幕边缘缓冲区处理
    let adjustedY = touchY;
    if (touchY < touchSettings.edgeBufferZone) {
        adjustedY = 0 + player.height / 2;
    } else if (touchY > canvas.height - touchSettings.edgeBufferZone) {
        adjustedY = canvas.height - player.height / 2;
    }
    
    // 2. 实现触摸平滑移动算法 - 增强版
    if (touchSettings.smoothingEnabled && lastTouchY !== null) {
        // 根据设备类型、速度和边缘位置调整平滑因子
        let currentSmoothing = touchSettings.sensitivity;
        
        // 快速移动时减少平滑，提高响应速度
        if (touchSettings.velocityBased && isHighVelocity) {
            currentSmoothing = Math.max(currentSmoothing * 0.5, 0.1);
            
            // 应用速度倍增因子
            const velocityFactor = 1 + Math.min(touchVelocity * touchSettings.accelerationSensitivity, 
                                              touchSettings.maxVelocityFactor - 1);
            const baseDelta = adjustedY - lastValidTouchY;
            adjustedY = lastValidTouchY + baseDelta * velocityFactor;
        } else {
            // 常规平滑处理
            adjustedY = lastValidTouchY + (adjustedY - lastValidTouchY) * currentSmoothing;
        }
        
        // 边缘区域特殊处理 - 减速
        if (isNearEdge) {
            const distanceToTop = adjustedY;
            const distanceToBottom = canvas.height - adjustedY;
            const minDistance = Math.min(distanceToTop, distanceToBottom);
            
            if (minDistance < touchSettings.edgeBufferZone) {
                const slowdownFactor = minDistance / touchSettings.edgeBufferZone * 
                                      (1 - touchSettings.edgeSlowdownFactor) + 
                                      touchSettings.edgeSlowdownFactor;
                const originalDelta = adjustedY - lastValidTouchY;
                adjustedY = lastValidTouchY + originalDelta * slowdownFactor;
            }
        }
    }
    
    // 3. 添加触摸区域容错处理，扩大可操作区域
    if (adjustedY < 0) adjustedY = 0;
    if (adjustedY > canvas.height) adjustedY = canvas.height;
    
    // 显示视觉反馈（如果启用）
    if (touchSettings.visualFeedback && deviceType === 'mobile' && !touchFeedbackActive) {
        showTouchFeedback(touchY);
    }
    
    // 记录本次触摸位置用于下次平滑计算
    lastValidTouchY = touchY;
    // 更新鼠标位置（用于球拍移动）
    mouseY = adjustedY;
    
    // 使用requestAnimationFrame确保平滑更新
    requestAnimationFrame(() => {
        updatePaddlePosition(adjustedY);
    });
}

// 添加触摸结束事件处理，重置触摸状态并处理点击操作 - 增强版
function handleTouchEnd(e) {
    // 始终阻止默认行为，确保触摸操作只影响游戏
    e.preventDefault();
    
    // 更新最后触摸时间戳
    lastTouchTime = Date.now();
    
    // 计算触摸持续时间
    const touchDuration = Date.now() - touchStartTime;
    const touchDistance = lastValidTouchY !== null ? Math.abs(lastValidTouchY - touchStartY) : 0;
    
    // 判断是否为快速点击操作（点击时间短且移动距离小）
    if (isTapOperation && touchDuration < 200 && touchDistance < 10) {
        // 处理触摸点击操作
        handleTouchTap();
    } else if (touchDuration > touchSettings.touchHoldThreshold && touchDistance < 15) {
        // 检测触摸保持操作
        handleTouchHold();
    }
    
    // 重置触摸速度和加速度 - 新增
    setTimeout(() => {
        touchVelocity *= 0.8;
        if (touchVelocity < 0.05) {
            touchVelocity = 0;
            isHighVelocity = false;
        }
    }, 50);
    
    // 重置触摸状态，但保留最后有效位置用于快速响应下次触摸
    setTimeout(() => {
        lastTouchY = null;
    }, touchSettings.responseDelay);
    
    // 重置状态
    lastTouchTimestamp = 0;
    touchAcceleration = 0;
    isTapOperation = false;
    
    // 清除触摸保持计时器
    if (touchHoldTimer) {
        clearTimeout(touchHoldTimer);
        touchHoldTimer = null;
    }
}

// 处理触摸点击操作 - 增强版
function handleTouchTap() {
    // 添加触觉反馈（如果支持）
    if (deviceType === 'mobile' && 'vibrate' in navigator) {
        navigator.vibrate(10); // 轻微振动10ms
    }
    
    if (gameOver) {
        // 游戏结束时点击重新开始
        resetGame();
        return;
    }
    
    if (gamePaused && gameStarted) {
        // 游戏暂停时点击继续
        gamePaused = false;
        gameStatusElement.textContent = '游戏继续...';
        setTimeout(() => {
            if (!gameOver && !gamePaused) {
                gameStatusElement.textContent = ball.isServing ? '轮到你发球' : '游戏进行中...';
            }
        }, 1000);
        return;
    }
    
    if (!gameStarted) {
        // 开始新游戏
        gameStarted = true;
        
        // 应用当前难度设置
        const settings = getCurrentDifficultySettings();
        ai.speed = settings.aiSpeed;
        
        // 显示难度信息
        let difficultyText = '';
        switch(currentDifficulty) {
            case 'easy':
                difficultyText = '简单';
                break;
            case 'medium':
                difficultyText = '适中';
                break;
            case 'hard':
                difficultyText = '直面雷霆的威光';
                break;
        }
        
        gameStatusElement.textContent = `难度: ${difficultyText} - 轮到你发球`;
        
        // 初始化球的位置，但保持发球状态
        ball.isServing = true;
    } else if (gameStarted && ball.isServing) {
        // 在发球状态下的点击可以直接发球
        const rect = canvas.getBoundingClientRect();
        const touchX = rect.width / 2; // 简化，触摸点击默认从中心发球
        
        // 根据触摸位置精确控制发球角度
        const normalizedY = (touchStartY - (canvas.height / 2)) / (canvas.height / 2);
        
        serveBall(touchX, touchStartY);
        
        // 检查是否可以增加发球速度
        const distanceFromCenter = Math.abs(touchStartY - (canvas.height / 2));
        if (distanceFromCenter < 30) {
            boostBall(touchStartY);
        }
    }
}

// 处理触摸保持操作 - 新增
function handleTouchHold() {
    // 可以在这里添加触摸保持相关的功能
    // 例如：在游戏暂停时显示菜单
    // 目前暂时不做特殊处理
}

// 显示触摸视觉反馈 - 新增
function showTouchFeedback(touchY) {
    if (!touchSettings.visualFeedback || touchFeedbackActive) return;
    
    touchFeedbackActive = true;
    
    // 绘制一个临时的视觉效果
    const feedbackRadius = 20;
    const feedbackX = player.x + player.width / 2;
    const feedbackOpacity = 0.7;
    
    // 保存当前状态
    ctx.save();
    ctx.globalAlpha = feedbackOpacity;
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; // 半透明蓝色
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.8)'; // 蓝色边框
    ctx.lineWidth = 2;
    
    // 绘制反馈效果
    ctx.beginPath();
    ctx.arc(feedbackX, touchY, feedbackRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 恢复状态
    ctx.restore();
    
    // 设置定时器清除反馈
    setTimeout(() => {
        touchFeedbackActive = false;
        // 重新绘制游戏画面以清除反馈
        draw();
    }, touchSettings.feedbackDuration);
}

// 统一的球拍位置更新函数 - 优化移动端体验
function updatePaddlePosition(yPosition) {
    // 计算球拍中心位置，确保球拍不会超出画布边界
    let targetY = yPosition - player.height / 2;
    
    // 优化移动端：添加边界平滑处理，避免生硬的边界碰撞感
    const borderSmoothness = 5; // 边界平滑系数
    
    // 上边界平滑处理
    if (targetY < 0) {
        // 靠近上边界时，根据距离逐渐降低移动速度
        const distanceToBorder = Math.abs(targetY);
        if (distanceToBorder < borderSmoothness) {
            // 添加弹性效果，使触摸靠近边界时仍有响应空间
            targetY = -distanceToBorder * 0.5;
        } else {
            targetY = 0;
        }
    }
    // 下边界平滑处理
    else if (targetY > canvas.height - player.height) {
        const distanceToBorder = targetY - (canvas.height - player.height);
        if (distanceToBorder < borderSmoothness) {
            // 添加弹性效果
            targetY = (canvas.height - player.height) + distanceToBorder * 0.5;
        } else {
            targetY = canvas.height - player.height;
        }
    }
    
    // 应用最终位置
    player.y = targetY;
    
    // 确保位置在有效范围内
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
}

// 重置所有事件监听器
function resetEventListeners() {
    // 移除所有事件监听器
    canvas.removeEventListener('mousemove', handleMouseMove);
    canvas.removeEventListener('click', handleMouseClick);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchmove', handleTouchMove);
    canvas.removeEventListener('touchend', handleTouchEnd);
}

// 设置事件监听器 - 改进版本，支持混合输入环境
function setupEventListeners() {
    // 移除现有的事件监听器以避免重复
    resetEventListeners();
    
    // 为所有设备添加基础事件监听器，但添加冲突处理逻辑
    // 移动设备上优先使用触摸事件，桌面设备优先使用鼠标事件
    
    // 添加鼠标事件支持
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', function(e) { 
        // 如果是从触摸事件触发的鼠标事件，则忽略
        if (Date.now() - lastTouchTime >= 250) {
            handleMouseClick(e);
        }
    });
    
    // 触摸事件监听器
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // 防止右键菜单出现
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// 添加鼠标离开画布时的处理
canvas.addEventListener('mouseleave', function() {
    // 鼠标离开时可以添加一些效果，比如暂停游戏
    // 这里暂时保留球拍的最后位置
});

// 处理鼠标点击 - 实现击球功能
function handleMouseClick(e) {
    // 获取鼠标在画布上的位置
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 如果游戏结束，点击重新开始
    if (gameOver) {
        resetGame();
        return;
    }
    
    // 如果游戏暂停，点击继续
    if (gamePaused && gameStarted) {
        gamePaused = false;
        gameStatusElement.textContent = '游戏继续...';
        setTimeout(() => {
            if (!gameOver && !gamePaused) {
                gameStatusElement.textContent = ball.isServing ? '轮到你发球' : '游戏进行中...';
            }
        }, 1000);
        return;
    }
    
    if (!gameStarted) {
        // 开始新游戏
        gameStarted = true;
        
        // 应用当前难度设置
        const settings = getCurrentDifficultySettings();
        ai.speed = settings.aiSpeed;
        
        // 显示难度信息
        let difficultyText = '';
        switch(currentDifficulty) {
            case 'easy':
                difficultyText = '简单';
                break;
            case 'medium':
                difficultyText = '适中';
                break;
            case 'hard':
                difficultyText = '直面雷霆的威光';
                break;
        }
        
        gameStatusElement.textContent = `难度: ${difficultyText} - 轮到你发球`;
        
        // 初始化球的位置，但保持发球状态
        ball.isServing = true;
    } else if (ball.isServing) {
        // 发球 - 基于鼠标点击位置决定球的初始方向和速度
        serveBall(mouseX, mouseY);
    } else {
        // 游戏进行中，检测点击是否在玩家球拍附近（可以作为额外的击球辅助）
        const isNearPaddle = Math.abs(mouseX - player.x) < 50 && 
                            Math.abs(mouseY - (player.y + player.height / 2)) < player.height;
        
        if (isNearPaddle && ball.x < canvas.width / 2) { // 只有当球在玩家一侧时才可以击球
            // 增强击球效果 - 可以调整球的速度和方向
            boostBall(mouseY);
        }
    }
}

// 发球函数 - 基于鼠标位置决定发球角度和力度
function serveBall(mouseX, mouseY) {
    // 计算鼠标相对于球拍的位置，确定发球角度
    const relativeY = mouseY - (player.y + player.height / 2);
    const angleFactor = relativeY / (player.height / 2);
    
    // 设置球的初始速度和方向
    const serveSpeed = 6; // 发球基础速度
    const maxAngle = Math.PI / 3; // 最大发球角度60度
    const serveAngle = angleFactor * maxAngle;
    
    // 根据角度设置速度分量
    ball.dx = serveSpeed * Math.cos(serveAngle);
    ball.dy = serveSpeed * Math.sin(serveAngle);
    
    // 结束发球状态
    ball.isServing = false;
    
    // 添加发球视觉效果
    gameStatusElement.textContent = '发球成功!';
    setTimeout(() => {
        gameStatusElement.textContent = '游戏进行中...';
    }, 1000);
}

// 增强击球效果
function boostBall(mouseY) {
    // 计算鼠标点击位置相对于球拍中心的偏移
    const hitPosition = (mouseY - (player.y + player.height / 2)) / (player.height / 2);
    
    // 调整球的垂直速度，使击球更有技巧性
    ball.dy += hitPosition * 2; // 根据点击位置增加垂直方向的速度
    
    // 限制最大速度
    const maxSpeed = 10;
    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed;
        ball.dx *= factor;
        ball.dy *= factor;
    }
}

// 绘制所有游戏元素
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制渐变背景
    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    backgroundGradient.addColorStop(0, '#1a1a1a');
    backgroundGradient.addColorStop(1, '#2c3e50');
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制中线
    drawCenterLine();
    
    // 绘制玩家球拍
    drawPaddle(player);
    
    // 绘制AI球拍
    drawPaddle(ai);
    
    // 绘制球
    drawBall();
    
    // 绘制视觉特效
    effects.draw();
    
    // 如果球在发球状态，绘制提示效果
    if (ball.isServing) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 绘制中线
function drawCenterLine() {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

// 绘制球拍
function drawPaddle(paddle) {
    // 绘制球拍阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(paddle.x + 2, paddle.y + 2, paddle.width, paddle.height);
    
    // 绘制球拍主体，使用渐变增加立体感
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y + paddle.height);
    gradient.addColorStop(0, paddle.color);
    gradient.addColorStop(1, shadeColor(paddle.color, -20)); // 暗色调
    ctx.fillStyle = gradient;
    
    // 绘制圆角矩形球拍
    ctx.beginPath();
    const radius = 5;
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - radius, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    ctx.fill();
    
    // 添加球拍边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// 辅助函数：调整颜色亮度
function shadeColor(color, percent) {
    // 将十六进制颜色转换为RGB
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    // 根据百分比调整颜色亮度
    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    // 确保颜色值在有效范围内
    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    // 转换回十六进制格式
    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);

    const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

// 视觉特效管理
const effects = {
    // 碰撞特效
    collisions: [],
    
    // 添加碰撞特效
    addCollisionEffect(x, y) {
        this.collisions.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 15,
            alpha: 1,
            color: '#f39c12'
        });
    },
    
    // 更新特效
    update() {
        for (let i = this.collisions.length - 1; i >= 0; i--) {
            const effect = this.collisions[i];
            effect.radius += 0.5;
            effect.alpha -= 0.05;
            
            if (effect.alpha <= 0) {
                this.collisions.splice(i, 1);
            }
        }
    },
    
    // 绘制特效
    draw() {
        for (const effect of this.collisions) {
            ctx.save();
            ctx.globalAlpha = effect.alpha;
            ctx.fillStyle = effect.color;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
};

// 绘制球
function drawBall() {
    // 绘制球的阴影，增加立体感
    ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
    ctx.beginPath();
    ctx.arc(ball.x + 2, ball.y + 2, ball.radius + 1, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制球主体
    ctx.fillStyle = ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加球边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 添加高光效果，增加立体感
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
}

// 检测球与球拍的碰撞
function checkCollision(ball, paddle) {
    return ball.x + ball.radius > paddle.x &&
           ball.x - ball.radius < paddle.x + paddle.width &&
           ball.y + ball.radius > paddle.y &&
           ball.y - ball.radius < paddle.y + paddle.height;
}

// 处理球的反弹
function handleBallRebound(paddle) {
    // 添加碰撞特效
    effects.addCollisionEffect(ball.x, ball.y);
    
    // 计算球与球拍碰撞的相对位置，用于确定反弹角度
    const hitPosition = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    
    // 根据碰撞位置调整反弹角度
    const maxAngle = Math.PI / 4; // 最大反弹角度45度
    const bounceAngle = hitPosition * maxAngle;
    
    // 重新设置球的速度和方向
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    
    // 根据是哪个球拍碰撞，设置正确的方向
    if (paddle === player) {
        ball.dx = speed * Math.cos(bounceAngle);
        ball.dy = speed * Math.sin(bounceAngle);
        // 确保球不会卡在球拍内
        ball.x = paddle.x + paddle.width + ball.radius;
    } else {
        ball.dx = -speed * Math.cos(bounceAngle);
        ball.dy = speed * Math.sin(bounceAngle);
        // 确保球不会卡在球拍内
        ball.x = paddle.x - ball.radius;
    }
    
    // 增加球的速度，使游戏越来越有挑战性
    ball.dx *= 1.02;
    ball.dy *= 1.02;
    
    // 限制最大速度
    const maxSpeed = 12;
    const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    if (currentSpeed > maxSpeed) {
        const factor = maxSpeed / currentSpeed;
        ball.dx *= factor;
        ball.dy *= factor;
    }
}

// 检查游戏是否结束（一方达到获胜分数）
function checkGameOver() {
    if (playerScore >= winningScore && playerScore - aiScore >= 2) {
        gameOver = true;
        gamePaused = true;
        gameStatusElement.textContent = '恭喜！你赢了！点击重新开始';
        gameStatusElement.classList.add('emphasis');
        return true;
    } else if (aiScore >= winningScore && aiScore - playerScore >= 2) {
        gameOver = true;
        gamePaused = true;
        gameStatusElement.textContent = '很遗憾，电脑赢了！点击重新开始';
        gameStatusElement.classList.add('emphasis');
        return true;
    }
    return false;
}

// 检查球是否出界
function checkBallOut() {
    // 检测球是否超出左边界（AI得分）
    if (ball.x + ball.radius < 0) {
        // AI得分
        aiScore++;
        updateScore();
        
        // 显示得分提示
        gameStatusElement.textContent = '电脑得分！';
        gameStatusElement.style.color = '#e74c3c';
        
        // 检查游戏是否结束
        if (checkGameOver()) {
            return true;
        }
        
        // 重置球，延迟后允许重新发球
        setTimeout(() => {
            resetBall(false); // false表示由玩家重新发球
            gameStatusElement.textContent = '准备发球';
            gameStatusElement.style.color = '#3498db';
        }, 1000);
        return true;
    }
    
    // 检测球是否超出右边界（玩家得分）
    if (ball.x - ball.radius > canvas.width) {
        // 玩家得分
        playerScore++;
        updateScore();
        
        // 显示得分提示
        gameStatusElement.textContent = '玩家得分！';
        gameStatusElement.style.color = '#2ecc71';
        
        // 检查游戏是否结束
        if (checkGameOver()) {
            return true;
        }
        
        // 重置球，延迟后允许重新发球
        setTimeout(() => {
            resetBall(true); // true表示由玩家重新发球
            gameStatusElement.textContent = '准备发球';
            gameStatusElement.style.color = '#3498db';
        }, 1000);
        return true;
    }
    
    return false;
}

// 游戏主循环
function gameLoop() {
    if (!gamePaused && gameStarted && !gameOver) {
        // 更新游戏状态
        update();
    }
    
    // 绘制游戏画面
    draw();
    
    // 继续下一帧
    requestAnimationFrame(gameLoop);
}

// 智能AI控制逻辑
function updateAI() {
    // 获取当前难度设置
    const settings = getCurrentDifficultySettings();
    
    // 预测球到达AI球拍位置的时间
    let predictedY = ball.y;
    let timeToReachAI;
    
    // 只有当球向AI方向移动时才进行预测
    if (ball.dx > 0) {
        // 计算时间
        timeToReachAI = (ai.x - ball.x) / ball.dx;
        
        if (timeToReachAI > 0) {
            // 根据预测准确度决定是否进行预测
            if (Math.random() < settings.predictionAccuracy) {
                // 模拟球的垂直反弹，预测最终到达AI球拍时的Y位置
                predictedY = simulateBounces(ball.x, ball.y, ball.dx, ball.dy, timeToReachAI, settings.maxPredictionSteps);
            }
            
            // 添加基于难度的随机性误差
            const randomFactor = (Math.random() - 0.5) * settings.errorMargin;
            predictedY += randomFactor;
        }
    }
    
    // 中心回归逻辑：当球远离AI时，AI会慢慢回到中心位置
    let targetY = predictedY;
    if (ball.dx <= 0) {
        // 球远离AI时，向中心移动
        const centerY = canvas.height / 2;
        const distanceToCenter = Math.abs(centerY - ai.y);
        
        if (distanceToCenter > ai.height / 2) {
            targetY = centerY;
        }
    }
    
    // 根据难度调整反应速度因子
    const speedFactor = ai.speed / 100; // 使用AI速度属性来计算反应速度因子
    
    // 添加反应时间延迟效果
    const reactionDelayFactor = settings.reactionTime / 200;
    const effectiveSpeedFactor = speedFactor * (1 - reactionDelayFactor);
    
    // 平滑移动到目标位置
    ai.y += (targetY - ai.y - ai.height / 2) * effectiveSpeedFactor;
    
    // 限制AI球拍在画布内
    ai.y = Math.max(0, Math.min(canvas.height - ai.height, ai.y));
}

// 模拟球在预测时间内的垂直反弹
function simulateBounces(startX, startY, dx, dy, time, maxSteps = 5) {
    let y = startY;
    let currentDy = dy; // 复制dy，避免修改原始值
    let remainingTime = time;
    let bounceCount = 0;
    
    while (remainingTime > 0 && bounceCount < maxSteps) {
        // 计算球到达上下边界所需的时间
        let timeToBoundary;
        let boundaryY;
        
        if (currentDy > 0) {
            // 向下移动
            boundaryY = canvas.height - ball.radius;
            timeToBoundary = (boundaryY - y) / currentDy;
        } else {
            // 向上移动
            boundaryY = ball.radius;
            timeToBoundary = (boundaryY - y) / currentDy;
        }
        
        // 如果在剩余时间内会碰到边界
        if (timeToBoundary <= remainingTime && timeToBoundary > 0) {
            remainingTime -= timeToBoundary;
            y = boundaryY;
            currentDy = -currentDy; // 反弹
            bounceCount++;
        } else {
            // 否则，在剩余时间内移动
            y += currentDy * remainingTime;
            remainingTime = 0;
        }
    }
    
    return y;
}

// 更新游戏状态
function update() {
    // 更新视觉特效
    effects.update();
    
    // 如果球不在发球状态，则更新球的位置
    if (!ball.isServing) {
        // 更新球的位置
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // 检测球是否出界
        if (checkBallOut()) {
            return;
        }
        
        // 检测球与上下边界的碰撞
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            // 添加边界碰撞特效
            effects.addCollisionEffect(ball.x, ball.y);
            
            ball.dy = -ball.dy;
            // 确保球不会卡在边界内
            if (ball.y + ball.radius > canvas.height) {
                ball.y = canvas.height - ball.radius;
            } else {
                ball.y = ball.radius;
            }
        }
        
        // 检测球与玩家球拍的碰撞
        if (checkCollision(ball, player)) {
            handleBallRebound(player);
        }
        
        // 检测球与AI球拍的碰撞
        if (checkCollision(ball, ai)) {
            handleBallRebound(ai);
        }
    } else {
        // 发球状态下，球跟随玩家球拍移动
        ball.x = player.x + player.width + ball.radius;
        ball.y = player.y + player.height / 2;
    }
    
    // 调用智能AI控制逻辑
    updateAI();
}

// 页面加载完成后初始化游戏
window.addEventListener('load', initGame);
