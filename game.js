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

// 初始化游戏
function initGame() {
    // 重置游戏状态
    resetGame();
    
    // 添加事件监听器
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', function(e) { handleMouseClick(e); });
    
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
    const rect = canvas.getBoundingClientRect();
    // 计算鼠标相对于画布的位置
    const mouseYRelative = e.clientY - rect.top;
    
    // 计算球拍中心位置，确保球拍不会超出画布边界
    player.y = mouseYRelative - player.height / 2;
    
    // 限制球拍在画布范围内
    if (player.y < 0) player.y = 0;
    if (player.y > canvas.height - player.height) player.y = canvas.height - player.height;
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
        gameStatusElement.textContent = '轮到你发球';
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
    // 预测球到达AI球拍位置的时间
    let predictedY = ball.y;
    let timeToReachAI;
    
    // 只有当球向AI方向移动时才进行预测
    if (ball.dx > 0) {
        // 计算时间
        timeToReachAI = (ai.x - ball.x) / ball.dx;
        
        if (timeToReachAI > 0) {
            // 模拟球的垂直反弹，预测最终到达AI球拍时的Y位置
            predictedY = simulateBounces(ball.x, ball.y, ball.dx, ball.dy, timeToReachAI);
            
            // 添加一些随机性，使AI更加真实
            const randomFactor = (Math.random() - 0.5) * 20;
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
    
    // 平滑移动到目标位置
    const speedFactor = 0.05; // 调整AI反应速度
    ai.y += (targetY - ai.y - ai.height / 2) * speedFactor;
    
    // 限制AI球拍在画布内
    ai.y = Math.max(0, Math.min(canvas.height - ai.height, ai.y));
}

// 模拟球在预测时间内的垂直反弹
function simulateBounces(startX, startY, dx, dy, time) {
    let y = startY;
    let currentDy = dy; // 复制dy，避免修改原始值
    let remainingTime = time;
    
    while (remainingTime > 0) {
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