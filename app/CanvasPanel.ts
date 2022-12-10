interface CanvasPanelOptions {
  width?: number;
  height?: number;
}

interface Options {
  fontZoom?: number;
  curZoom?: number;
  translateX?: number;
  translateY?: number;
}

class CanvasPanel {
  options: Options & CanvasPanelOptions;
  canvas: null | HTMLCanvasElement = null;
  dragFlag = false;
  ctx: null | CanvasRenderingContext2D = null;

  constructor(options: CanvasPanelOptions = {}) {
    this.options = {
      ...options,
      width: options.width || 1200,
      height: options.height || 1200,
      fontZoom: 1,
      curZoom: 1,
      translateX: 0,
      translateY: 0,
    };

    this.createCanvas();
  }

  createCanvas() {
    const canvasEle = document.createElement("canvas");
    const divEle = document.createElement("div");

    canvasEle.style.width = this.options?.width / 2 + "px";
    canvasEle.style.height = this.options?.height / 2 + "px";
    canvasEle.width = this.options.width;
    canvasEle.height = this.options.height;

    const _this = this;

    canvasEle.addEventListener("mousedown", (e) => {
      _this.dragFlag = true;

      let x = e.clientX;
      let y = e.clientY;

      canvasEle.style.cursor = "pointer";

      // console.log(`x: ${x}, y: ${y}`)

      function onMouseMove(e: MouseEvent) {
        console.log(e.clientX, e.clientY);
        const { mX, mY } = { mX: e.clientX, mY: e.clientY };
        // console.log(`mX: ${mX}, mY: ${mY}`)
        _this.drag(mX - x, mY - y);
        x = mX;
        y = mY;
      }

      function onMouseUp(e?: MouseEvent) {
        _this.dragFlag = false;
        canvasEle.style.cursor = "default";
        console.log("CanvasPanel.dragFlag", this.dragFlag);
        canvasEle.removeEventListener("mousemove", onMouseMove);
        canvasEle.removeEventListener("mouseup", onMouseUp);
      }

      function onMouseLeave(e: MouseEvent) {
        onMouseUp();
      }

      canvasEle.addEventListener("mousemove", onMouseMove);
      canvasEle.addEventListener("mouseup", onMouseUp);
      canvasEle.addEventListener("mouseleave", onMouseLeave);
    });

    canvasEle.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    divEle.addEventListener(
      "mousewheel",
      (e: WheelEvent) => {
        e.preventDefault();
      },
      false
    );

    divEle.appendChild(canvasEle);
    document.body.appendChild(divEle);
    this.canvas = canvasEle;
    this.ctx = this.canvas.getContext("2d");
    this.draw();

    this.canvas.addEventListener(
      "mousewheel",
      (e: WheelEvent) => {
        let z = e.deltaY > 0 ? -0.1 : 0.1;
        // console.log(`e.offsetX: ${e.offsetX}, e.offsetY: ${e.offsetY}, e.deltaY: ${e.deltaY}`)
        _this.zoom(e.offsetX, e.offsetY, z);
      },
      false
    );

    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
      document.getElementById(
        "text"
      ).innerHTML = `x: ${e.offsetX}, y: ${e.offsetY}`;
    });

    this.preventDefault();
  }

  draw() {
    this.ctx.fillRect(
      (this.options.width - 100) / 2,
      (this.options.height - 100) / 2,
      100,
      100
    );
  }

  /**
   *
   * 滚轮缩放
   *
   */
  zoom(offsetX: number, offsetY: number, z: number) {
    this.options.curZoom = this.options.fontZoom + z;

    // curZoom 为负值时会发生翻转
    if (this.options.curZoom <= 0) {
      this.options.curZoom = this.options.fontZoom;
      return;
    }
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    // 目标坐标=事件坐标+(图形坐标−事件坐标)×缩放倍数
    // this.options.translateX = (this.options.translateX - (offsetX * 2 * z))
    // this.options.translateY = (this.options.translateY - (offsetY * 2 * z))

    this.options.translateX = -(offsetX * 2) * (this.options.curZoom - 1);
    this.options.translateY = -(offsetY * 2) * (this.options.curZoom - 1);
    // this.options.translateX = - (-(this.options.translateX - offsetX * 2 * z))
    // this.options.translateY = - (-(this.options.translateY - offsetY * 2 * z))

    console.log(
      `offsetX: ${offsetX}, offsetY: ${offsetY}, \ntranslateX: ${this.options.translateX}, translateY: ${this.options.translateY}, curZoom: ${this.options.curZoom}, z: ${z}`
    );

    // this.ctx.fillRect(offsetX * 2, offsetY * 2, 5, 5)
    // 平移到鼠标当前点位置没有变化
    this.ctx.translate(this.options.translateX, this.options.translateY);
    // 默认缩放圆心 (0,0)
    // https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/scale
    this.ctx.scale(this.options.curZoom, this.options.curZoom);
    this.draw();
    this.ctx.restore();
    // this.fontY = offsetY
    // this.fontX = offsetX
    this.options.fontZoom = this.options.curZoom;
  }
  reset() {
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    this.draw();
    this.options.curZoom = 1;
    this.options.fontZoom = 1;
    this.dragFlag = false;
    this.options.translateX = 0;
    this.options.translateY = 0;
  }
  /**
   *
   * 平移
   *
   */
  drag(offsetX: number, offsetY: number) {
    // console.log(this.dragFlag, this.curZoom)
    if (this.dragFlag) {
      console.log(
        "1: offsetX",
        offsetX,
        "offsetY",
        offsetY,
        this.options.translateX,
        this.options.translateY
      );
      // 不用乘缩放倍数
      this.options.translateX = this.options.translateX + offsetX * 2; // 因为是两倍
      this.options.translateY = this.options.translateY + offsetY * 2;
      console.log(
        "2: offsetX",
        offsetX,
        "offsetY",
        offsetY,
        this.options.translateX,
        this.options.translateY
      );

      this.ctx.save();
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      this.ctx.translate(this.options.translateX, this.options.translateY);
      this.ctx.scale(this.options.curZoom, this.options.curZoom);
      this.draw();
      this.ctx.restore();
    }
  }
  preventDefault() {
    document.body.addEventListener("DOMMouseScroll", function (e) {
      e.preventDefault();
    });
    document.body.addEventListener(
      "mousewheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        // console.log('document.getElementsByTagName(body)')
      },
      { passive: false }
    );
  }
}

export default CanvasPanel;
