const degToRad = (angle) => ((angle * Math.PI) / 180)

class Snake {
    constructor(x, y, angle, length, game) {
        this.color = '#ff5050'
        //this.name = name
        this.x = x
        this.y = y
        this.angle = angle
        this.length = length
        this.ctx = game.ctx
        this.game = game
        this.coordinates = []
    }

    draw() { //ヘビを描画
        this.ctx.beginPath()
        this.ctx.fillStyle = this.color
        this.ctx.arc(this.x, this.y, Snake.HEAD_RADIUS, 0, 2 * Math.PI)
        this.ctx.fill()
        this.ctx.closePath()
    }

    running(canvasSize, that) { //setIntervalで何度も動かす
        const radian = degToRad(that.angle)
        that.x += Snake.SPEED * Math.cos(radian)
        that.y += Snake.SPEED * Math.sin(radian)
        that.validationCoordinates(canvasSize)
        that.pushCoordinates()
        that.draw()
        that.findSnakeCollision()
    }

    validationCoordinates({mapW, mapH}) { //枠外に出たかどうか
        if (
            (this.x < 0) || (this.x > mapW) ||
            (this.y < 0) || (this.y > mapH)
        ) {
            finishGame(this.game)
        }
    }

    pushCoordinates() { //位置を保持する
        this.coordinates.push({
            x: this.x,
            y: this.y,
        })
        this.snakeLengthContorol()
    }

    snakeLengthContorol() { //尻尾の方から削除していく
        if (this.coordinates.length > this.length) {
            const {x, y} = this.coordinates[0]
            this.ctx.beginPath()
            this.ctx.fillStyle = '#fff'
            this.ctx.arc(x, y, Snake.HEAD_RADIUS + 2, 0, 2 * Math.PI)
            this.ctx.fill()
            this.ctx.closePath()

            this.coordinates.shift()
        }
    }

    findSnakeCollision() { //自分の体にぶつかったら
        this.coordinates.slice(0, -Snake.HEAD_RADIUS).forEach(({x, y}) => {
            const distance = Math.sqrt(((x - this.x) ** 2) + ((y - this.y) ** 2))
            if (distance < Snake.HEAD_RADIUS + 2) {
                finishGame(this.game)
            }
        })
    }

    directionControl(e) { //進む方向を決める
        if (this.game.finished) return
        switch (e.keyCode) {
            case 37: {
                this.turnLeft()
                break
            }
            case 38: {
                this.turnRight()
                break
            }
        }
    }

    turnLeft() {
        this.angle -= Snake.ROTATION_SPEED
        this.move(true)
    }

    turnRight() {
        this.angle += Snake.ROTATION_SPEED
        this.move(true)
    }

    move(rotate = false) {
        const coef = rotate ? 0.8 : 1
        this.x += coef * Snake.SPEED * Math.cos(degToRad(this.angle))
        this.y += coef * Snake.SPEED * Math.sin(degToRad(this.angle))
        this.pushCoordinates()
        this.draw()
    }
}

Snake.HEAD_RADIUS = 5 //ヘビの頭の大きさ
Snake.SPEED = 2 //ヘビのスピード
Snake.ROTATION_SPEED = 10 //ヘビの曲がる時のスピード
Snake.INITIAL_LENGTH = 150 //ヘビの全長

class Food {
    constructor(x, y, color, ctx) {
        this.x = x
        this.y = y
        this.color = color
        this.draw(ctx)
    }

    draw(ctx) { //食べ物を描画
        ctx.beginPath()
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, Food.RADIUS, 0, 2 * Math.PI)
        ctx.fill()
        ctx.closePath()
    }

    destroy(ctx) { //ヘビに食べられた後の処理
        ctx.beginPath()
        ctx.fillStyle = '#fff'
        ctx.strokeStyle = '#fff'
        ctx.arc(this.x, this.y, Food.RADIUS, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        ctx.closePath()
    }
}

Food.RADIUS = 6 //食べ物の大きさ

const foodGeneration = (foods = [], ctx) => { //食べ物の生成
    const maxAmountOfFoods = 100
    let diff = maxAmountOfFoods - foods.length
    while (diff > 0) {
        const x = (Math.random() * 500) >> 0
        const y = (Math.random() * 500) >> 0
        const color = '#' + ((1 << 24) * Math.random()|0).toString(16)
        const food = new Food(x, y, color, ctx)
        foods.push(food)
        diff--
    }
}

const findFoodCollisions = (foods, ctx, snake) => { //ヘビが食べ物を食べたかどうか
    for (const food of foods) {
        if (
            (snake.x > food.x - 10) && (snake.x < food.x + 10) &&
            (snake.y > food.y - 10) && (snake.y < food.y + 10)
        ) {
            food.destroy(ctx)
            foods.splice(foods.indexOf(food), 1)
            snake.length += 1
            changeScore(snake.length - Snake.INITIAL_LENGTH)
        }
    }
}

const changeScore = (score) => { //スコアの表示
    const scoreElem = document.getElementById('score')
    scoreElem.innerHTML = `length: ${score}`
}

const startGame = (game) => { //ゲームスタート時
    const { snake, foods, ctx } = game
    foodGeneration(foods, ctx)

    const canvasSize = {mapW: 500, mapH: 500}
    game.snakeInterval = setInterval(snake.running, 30, canvasSize, snake)
    game.foodInterval = setInterval(findFoodCollisions, 15, foods, ctx, snake)

    addEventListener('keydown', snake.directionControl.bind(snake))
}

const finishGame = (game) => { //ゲームオーバー時
    if (game.finished) return
    const { snake, snakeInterval, foodInterval} = game
    clearInterval(snakeInterval)
    clearInterval(foodInterval)
    game.finished = true
    alert('You lose')
}

window.onload = () => {
    const canvas = document.getElementById('map')
    const ctx = canvas.getContext('2d')
    const game = { ctx }

    game.snake = new Snake(100, 100, 0, Snake.INITIAL_LENGTH, game)
    game.foods = []

    startGame(game)
}