'use strict'
let timePie = function(canvas,options={}) {

  this.tempCanvas = document.createElement('canvas'); // 新建一个 canvas 作为缓存 canvas
  this.ctx = this.tempCanvas.getContext('2d');

  this.canvas = canvas

  // this.ctx = this.canvas.getContext('2d')

  this.viewCtx = canvas.getContext('2d')

  // this.viewCtx.imageSmoothingQuality = "high"

  let _this = this
  let Default = {
    week: [ 'Sun', 'Sat', 'Fri', 'Thu', 'Wnd', 'Tue', 'Mon' ],
    // week: [ '周日', '周六', '周五', '周四', '周三', '周二', '周一' ],
    hours :[
      '6am','7am', '8am', '9am','10am','11am','12am', 
      '1pm', '2pm', '3pm', '4pm', '5pm',
      '6pm', '7pm', '8pm', '9pm', '10pm', '11pm','12pm', 
      '1am', '2am', '3am', '4am', '5am', 
    ],
    card:{
      title:'标题',
      inner:function(value,week,hours){
        return `${week} ${hours}:${value}`
      },
      isShowColorSpan:true
    },
    judgeColor:function(value) {
      if (value > 75) {
        return 'rgb(1,94,176)'
      } else if (value <= 75 && value > 50) {
        return 'rgb(51,160,236)'
      } else if (value <= 50 && value > 25) {
        return 'rgb(96,183,293)'
      } else if (value <= 25 && value >= 0) {
        return 'rgb(159,214,244)'
        // return 'hsl(201,79%,79%)'
      }
    },
    radius:90,
    layerWidth:12,
    lineWidth:10,
    fontSize:12,
    horizontalFontOffset:{
      xOffset:0,
      yOffset:3,
    },
    leftRoundFontOffset:{
      xOffset:0,
      yOffset:3,
    },
    rightRoundFontOffset:{
      xOffset:10,
      yOffset:3,
    }
  }
  this.config = util.extend(Default,options)

}

let util = {
  extend(obj,addObj){
    for( let key in addObj){
      if(
        Object.prototype.toString.call(obj[key])==='[object Object]' && 
        Object.prototype.toString.call(addObj[key])==='[object Object]'  
      ){
        obj[key] = this.extend(obj[key],addObj[key])
      }else{
        obj[key] = addObj[key]
      }
    }
    return obj
  },
    /**
   * Converts an HSL color value to RGB. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes h, s, and l are contained in the set [0, 1] and
   * returns r, g, and b in the set [0, 255].
   *
   * @param   {number}  h       The hue
   * @param   {number}  s       The saturation
   * @param   {number}  l       The lightness
   * @return  {Array}           The RGB representation
   */
  hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  },
  /**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
  rgbToHsl(r, g, b){
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }
  return [h*360, s,l];
  },
  rgbStringToNumber(rgbString){
    let matchTag = rgbString.trim().match(/^rgb\((.*?),(.*?),(.*?)\)$/)
    try{
      if(matchTag){
        return [
          parseInt(matchTag[1]),
          parseInt(matchTag[2]),
          parseInt(matchTag[3])
        ]
      }
    } catch{
      throw new Error('rgb格式可能有问题，转换数字失败')
    }
  },
  rgbaStringToNumber(rgbString){
    let matchTag = rgbString.trim().match(/^rgba\((.*?),(.*?),(.*?),(.*?)\)$/)
    try{
      if(matchTag){
        return [
          parseInt(matchTag[1]),
          parseInt(matchTag[2]),
          parseInt(matchTag[3]),
          parseFloat(matchTag[4])
        ]
      }
    } catch{
      throw new Error('rgba格式可能有问题，转换数字失败')
    }
  },
  rgbaToRgb(source){
    let Source ={}
    let Target ={}
    let BGColor={
      R:255,
      G:255,
      B:255
    }
    Source.R = source[0]
    Source.G = source[1]
    Source.B = source[2]
    Source.A = source[3]
    Target.R = ((1 - Source.A) * BGColor.R) + (Source.A * Source.R)
    Target.G = ((1 - Source.A) * BGColor.G) + (Source.A * Source.G)
    Target.B = ((1 - Source.A) * BGColor.B) + (Source.A * Source.B)
    return[Target.R,Target.G,Target.B]
  },
  colorStringToRgbString (color) {
    var div = document.createElement('div');
    div.style.backgroundColor = color;
    document.body.appendChild(div);
    var c = window.getComputedStyle(div).backgroundColor;    
    document.body.removeChild(div);
    return c;
  },
  rgbArrayToString(rgbArray){
    return `rbg(${rgbArray[0]},${rgbArray[1]},${rgbArray[2]})`
  },
  hslArrayToString(hslArray){
    function toPercent(point){
      var str=(point*100).toFixed(2);
      str+="%";
      return str;
    }
    return `hsl(${hslArray[0]},${toPercent(hslArray[1])},${toPercent(hslArray[2])})`
  },
  isRgba(color){
    // console.log(color)
    let matchTag = color.trim().match(/^rgba/)
    if(matchTag) return true
    return false
  },
  highlight(color){
    if(this.isRgba(color)){
      let rgbaArray = this.rgbaStringToNumber(color)
      let rgbArray = this.rgbaToRgb(rgbaArray)
      let hslArray = this.rgbToHsl(...rgbArray)
      hslArray[2]+=0.1
      if(hslArray[2]>1){
        hslArray[2] = 1
      }
      return this.hslArrayToString(hslArray)
    } else{
      let rgbString = this.colorStringToRgbString(color)
      let rgbArray = this.rgbStringToNumber(rgbString)
      let hslArray = this.rgbToHsl(...rgbArray)
      hslArray[2]+=0.1
      if(hslArray[2]>1){
        hslArray[2] = 1
      }
      let hslString = this.hslArrayToString(hslArray)
      return hslString
    }
  }
}

timePie.prototype.init = function() {
  this.dataInit()
  this.canvasInit()
  this.cardInit()
  // this.paintCenter()
  this.drawOrigin()
  this.drawFont()
  this.updateView()
  this.addMouseListener()
}
timePie.prototype.dataInit = function(){
  // 生成数据

  this.week = this.config.week
  this.hours = this.config.hours

  if(this.config.timeMap){
    this.timeMap = this.config.timeMap
    return ;
  }

  this.timeMap = []

  for (let j = 0; j < 7; j++) {
    let newItem = []
    for (let i = 0; i < 24; i++) {
      newItem.push(Math.random() * 100)
    }
    this.timeMap.push(newItem)
  }


}




timePie.prototype.canvasInit = function() {
  // dpr init
  if (window && window.devicePixelRatio) {
    if (
      Object.prototype.toString.call(window.devicePixelRatio) ===
      '[object Number]'
    ) {
      this.dpr = window.devicePixelRatio
    } else {
      this.dpr = 1
    }
  } else {
    this.dpr = 1
  }
  // const in canvas init
  let StyleDeclaration = window.getComputedStyle(this.canvas)

  let canvasHeight = timePie.getPxIntValue(StyleDeclaration, 'height')
  let canvasWidth = timePie.getPxIntValue(StyleDeclaration, 'width')
  this.canvas.height = canvasHeight * this.dpr
  this.canvas.width = canvasWidth * this.dpr

  this.tempCanvas.height = canvasHeight * this.dpr
  this.tempCanvas.width = canvasWidth * this.dpr

  // this.ctx.scale(this.dpr,this.dpr)
  // this.viewCtx.scale(this.dpr,this.dpr)


  this.canvasXCenter = (canvasWidth / 2) * this.dpr
  console.log(this.canvasXCenter)
  this.canvasYCenter = (canvasHeight / 2) * this.dpr
  this.radius = this.config.radius * this.dpr
  this.layerWidth = this.config.layerWidth * this.dpr
  this.lineWidth = this.config.lineWidth * this.dpr

  // 上次hover坐标,初始化时设为不存在的坐标，避免重复重绘
  this.lastPosition = [99, 99]

  // 是否是原图
  this.isOrigin = true

  // 避免card闪烁，增加closing
  this.timer = undefined

  // 初始角度
  this.angle = -Math.PI / 26


}

timePie.prototype.paintCenter = function() {
  // 这里绘制一个中心点，用于对齐调试
  this.ctx.lineWidth = 1 //设置线宽

  this.ctx.arc(this.canvasXCenter, this.canvasYCenter, 1, 0, Math.PI * 2, false)
  this.ctx.stroke() //绘制
  // 中心点绘制结束
}

timePie.prototype.drawArc = function(x, y, r, color, addValue, lineWidth) {
  this.ctx.strokeStyle = color
  this.ctx.lineWidth = lineWidth //设置线宽
  this.ctx.beginPath() //路径开始

  this.ctx.arc(x, y, r, this.angle, this.angle + addValue, false) //用于绘制圆弧context.arc(x坐标，y坐标，半径，起始角度，终止角度，顺时针/逆时针)
  this.angle += addValue
  this.ctx.stroke() //绘制
  this.ctx.closePath() //路径结束
}

timePie.prototype.drawOrigin = function() {
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 24; i++) {
      // console.log(this.judgeColor(this.timeMap[j][i]))
      this.drawArc(
        this.canvasXCenter,
        this.canvasYCenter,
        this.radius - j * this.layerWidth,
        this.judgeColor(this.timeMap[j][i]),
        Math.PI / 13,
        this.lineWidth
      )
      this.drawArc(
        this.canvasXCenter,
        this.canvasYCenter,
        this.radius - j * this.layerWidth,
        '#fff',
        Math.PI / 12 / 13,
        this.lineWidth
      )
    }
  }
}

timePie.prototype.drawFont = function() {
  let ctx = this.ctx
  let canvasXCenter = this.canvasXCenter
  let canvasYCenter = this.canvasYCenter
  let dpr = this.dpr
  let radius = this.radius
  let week = this.week
  let hours = this.hours
  let layerWidth = this.layerWidth
  let _this = this

  ctx.font = `${this.config.fontSize * dpr}px serif`
  ctx.fillStyle = 'rgb(223,236,243)'
  for (let i = 0; i < 7; i++) {
    ctx.fillText(
      week[6-i],
      canvasXCenter - this.config.fontSize * 0.8 * dpr - this.config.horizontalFontOffset.xOffset * dpr,
      canvasYCenter - this.config.horizontalFontOffset.yOffset * dpr - layerWidth * (i + 1)
    )
  }

  ctx.fillStyle = 'rgb(0,0,0)'

  for (let i = 0; i < 7; i++) {
    ctx.save()
    ctx.translate(canvasXCenter, canvasYCenter)
    ctx.rotate((Math.PI / 12) * i)
    // ctx.fillText(`${6 + i}pm`, 0 - radius - 35 * dpr, 0 + 3 * dpr)
    ctx.fillText(hours[12+i], 0 - radius - _this.config.fontSize *3 * dpr - _this.config.leftRoundFontOffset.xOffset*dpr,  _this.config.leftRoundFontOffset.yOffset * dpr)
    ctx.restore()
  }
  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.translate(canvasXCenter, canvasYCenter)
    ctx.rotate((-Math.PI / 12) * (i + 1))
    // ctx.fillText(`${5 - i}pm`, 0 - radius - 35 * dpr, 0 + 3 * dpr)
    ctx.fillText(hours[11-i], 0 - radius - _this.config.fontSize *3 * dpr- _this.config.leftRoundFontOffset.xOffset*dpr,  _this.config.leftRoundFontOffset.yOffset * dpr)
    ctx.restore()
  }

  for (let i = 0; i < 5; i++) {
    ctx.save()
    ctx.translate(canvasXCenter, canvasYCenter)
    ctx.rotate((-Math.PI / 12) * (i + 1))
    // ctx.fillText(`${5 - i}am`, 0 + radius + 10 * dpr, 0 + 3 * dpr)
    ctx.fillText(hours[23-i], 0 + radius + _this.config.rightRoundFontOffset.xOffset*dpr, _this.config.rightRoundFontOffset.yOffset* dpr)
    ctx.restore()
  }
  for (let i = 0; i < 7; i++) {
    ctx.save()
    ctx.translate(canvasXCenter, canvasYCenter)
    ctx.rotate((Math.PI / 12) * i)
    // ctx.fillText(`${6 + i}am`, 0 + radius + 10 * dpr, 0 + 3 * dpr)
    ctx.fillText(hours[i], 0 + radius + _this.config.rightRoundFontOffset.xOffset*dpr, _this.config.rightRoundFontOffset.yOffset* dpr)
    ctx.restore()
  }
}

timePie.prototype.destroy = function() {}

timePie.prototype.addMouseListener = function() {
  let _this = this
  this.mouseListener = document.addEventListener('mousemove', function(evt) {
    let rect = _this.canvas.getBoundingClientRect()

    let leftX = (evt.clientX - rect.left) * (canvas.width / rect.width)
    let topY = (evt.clientY - rect.top) * (canvas.height / rect.height)

    // 以canvas中心为原点的平面直角坐标系，坐标为canvas画布的坐标
    let newX = leftX - _this.canvasXCenter
    let newY = topY - _this.canvasYCenter

    let [r, theta] = timePie.DescartesToPolar(newX, newY)
    let [rPosition, thetaPosition] = _this.judgePosition(r, theta)
    // console.log([rPosition,thetaPosition])
    if (rPosition !== undefined && thetaPosition !== undefined) {
      if (
        _this.isOrigin ||
        _this.lastPosition[0] !== rPosition ||
        _this.lastPosition[1] !== thetaPosition
      ) {
        _this.reDraw(rPosition, thetaPosition)
        _this.updateView()
        _this.showCard(rPosition, thetaPosition)
        _this.isOrigin = false
        // console.log([rPosition,thetaPosition])
      }
    } else {
      if (_this.isOrigin === false) {
        _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height)
        _this.drawOrigin()
        _this.drawFont()
        _this.updateView()
        _this.hideCard()
        _this.isOrigin = true
        // console.log([rPosition,thetaPosition])
      }
    }
  })
}

timePie.prototype.reDraw = function(rPosition, thetaPosition) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

  // this.paintCenter()
  for (let j = 0; j < 7; j++) {
    for (let i = 0; i < 24; i++) {
      if (j === rPosition && i === thetaPosition) {
        // console.log(this.judgeColor(this.timeMap[j][i]))
        this.drawArc(
          this.canvasXCenter,
          this.canvasYCenter,
          this.radius - j * this.layerWidth,
          util.highlight(this.judgeColor(this.timeMap[j][i])),
          // timePie.judgeColor(this.timeMap[j][i]),
          // 'hsl(201.1764705882353,79%,90.15%)',
          Math.PI / 13,
          this.lineWidth
        )
      } else {
        this.drawArc(
          this.canvasXCenter,
          this.canvasYCenter,
          this.radius - j * this.layerWidth,
          this.judgeColor(this.timeMap[j][i]),
          Math.PI / 13,
          this.lineWidth
        )
      }
      this.drawArc(
        this.canvasXCenter,
        this.canvasYCenter,
        this.radius - j * this.layerWidth,
        '#fff',
        Math.PI / 12 / 13,
        this.lineWidth
      )
    }
  }
  this.drawFont()
  this.lastPosition = [rPosition, thetaPosition]
}
// 笛卡尔坐标系转极坐标
timePie.DescartesToPolar = function(x, y) {
  let r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
  // 处理arctan，返回值为[-pi,+pi]
  let theta = Math.atan2(y, x)
  return [r, theta]
}



timePie.prototype.judgeColor = function(value){
  // console.log(this.config.judgeColor)
  return this.config.judgeColor(value)
}

timePie.getPxIntValue = function(styleDeclaration, propertyName) {
  let propertyValue = styleDeclaration.getPropertyValue(propertyName)
  return parseFloat(propertyValue.split('px')[0], 10)
}

timePie.prototype.judgePosition = function(r, theta) {
  // 判断r区域
  // rPosition取值为 [0,6] 或 undefined
  let rPosition = undefined
  for (let i = 0; i < 7; i++) {
    let center = this.radius - this.layerWidth * i
    if (r > center - this.lineWidth / 2 && r < center + this.lineWidth / 2) {
      rPosition = i
    }
  }

  // 判断theta区域
  // thetaPosition取值为 [0,23] 或 undefined
  let thetaPosition = undefined
  for (let i = 0; i < 12; i++) {
    let center = (i * 2 * Math.PI) / 24
    if (theta > center - Math.PI / 26 && theta < center + Math.PI / 26) {
      thetaPosition = i
    }
  }

  if (theta > Math.PI - Math.PI / 26 && theta < Math.PI) {
    thetaPosition = 12
  }
  if (theta > -Math.PI && theta < -Math.PI + Math.PI / 26) {
    thetaPosition = 12
  }

  for (let i = 13; i < 24; i++) {
    let center = (i * 2 * Math.PI) / 24 - 2 * Math.PI
    if (theta > center - Math.PI / 26 && theta < center + Math.PI / 26) {
      thetaPosition = i
    }
  }

  return [rPosition, thetaPosition]
}

timePie.prototype.cardInit = function() {
  this.container = this.canvas.parentNode
  let ctrStyleDla = this.container.style
  ctrStyleDla.setProperty('position', 'relative')
  this.card = {}
  this.card.dom = document.createElement('div')
  this.card.box = document.createElement('div')
  this.card.box.style.cssText = `
    position: absolute;
    display: none;
    border-radius: 10px;
    background: rgba(71, 68, 68, 0.8);
    transition: top 0.4s,left 0.4s;
    color:#fff;
    z-index:999;
  `
  this.card.dom.style.cssText = `
    display: flex;
    padding:10px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `
  // width: 120px;
  // height: 60px;

  this.card.box.appendChild(this.card.dom)
  this.container.appendChild(this.card.box)
  this.card.titleSpan = document.createElement('span')
  this.card.titleSpan.innerText = this.config.card.title

  this.card.valueSpan = document.createElement('span')
  this.card.colorSpan = document.createElement('span')
  this.card.dataSpan = document.createElement('span')
  this.card.dataSpan.style.cssText = `
    align-self:flex-start;
  `
  this.card.dom.appendChild(this.card.titleSpan)
  this.card.dom.appendChild(this.card.dataSpan)
  this.card.colorSpan.style.cssText = `
    height:12px;
    width:12px;
    border-radius: 50%;
    margin-right:8px;
    display:${isShowColorSpan(this.config.card.isShowColorSpan)}
  `
  function isShowColorSpan(bool){
    console.log(bool)
    if(bool){
      return 'inline-block'
    }
    else{
      return 'none'
    }
  }
  this.card.dataSpan.appendChild(this.card.colorSpan)
  this.card.dataSpan.appendChild(this.card.valueSpan)

//this.card 的结构
{/* 
  <card.box>
    <card.dom>
      <titleSpan></titleSpan>
      <dataSpan>
        <colorSpan></colorSpan>
        <valueSpan></valueSpan>
      </dataSpan>
    </card.dom>
  </card.box> 
*/}
}

timePie.prototype.showCard = function(rPosition, thetaPosition) {
  this.card.box.style.setProperty('display', 'inline-block')
  this.card.value = this.timeMap[rPosition][thetaPosition]

  this.card.color = this.judgeColor(this.card.value)
  this.card.colorSpan.style.backgroundColor = this.card.color
  this.card.valueSpan.innerText = this.config.card.inner(this.card.value,this.week[rPosition],this.hours[thetaPosition])

  if (this.timer) {
    clearTimeout(this.timer)
  }

  let parentNodeRect = this.container.getBoundingClientRect()
  // console.log(parentNodeRect)
  let canvasRect = this.canvas.getBoundingClientRect()
  // console.log(this.canvas)
  let canvasStyle = window.getComputedStyle(this.canvas)
  let canvasCssHeight = timePie.getPxIntValue(canvasStyle, 'height')
  let canvasCssWidth = timePie.getPxIntValue(canvasStyle, 'width')
  let xOffset = canvasRect.left - parentNodeRect.left + canvasCssWidth / 2
  let yOffset = canvasRect.top - parentNodeRect.top + canvasCssHeight / 2
  console.log(xOffset, yOffset)

  let [x, y] = this.positionToDescartes(rPosition, thetaPosition)
  console.log([x, y])
  this.card.box.style.top = y + yOffset + 'px'
  this.card.box.style.left = x + xOffset + 'px'
}
timePie.prototype.hideCard = function() {
  this.timer = setTimeout(() => {
    this.card.box.style.setProperty('display', 'none')
    this.timer = undefined
  }, 200)
}

timePie.prototype.positionToDescartes = function(rPosition, thetaPosition) {
  let r = this.radius / this.dpr - (rPosition * this.layerWidth) / this.dpr
  let theta = (thetaPosition * 2 * Math.PI) / 24
  let x = Math.cos(theta) * r
  let y = Math.sin(theta) * r
  return [x, y]
}

timePie.prototype.updateView = function(){
  // console.log(this.canvas)
  this.viewCtx.clearRect(0,0,this.canvas.height,this.canvas.width)
  this.viewCtx.drawImage(this.tempCanvas,0,0)
}

