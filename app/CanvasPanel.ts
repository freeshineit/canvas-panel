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

/**
 * Canvas 画板
 */
class CanvasPanel {
  options: Options & CanvasPanelOptions;
  canvas: null | HTMLCanvasElement = null;
  dragFlag = false;
  ctx: null | CanvasRenderingContext2D = null;

  private dpr = 2;

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

  /**
   * 创建画布
   */
  createCanvas() {
    const canvasEle = document.createElement("canvas");
    const divEle = document.createElement("div");

    canvasEle.style.width = this.options?.width / this.dpr + "px";
    canvasEle.style.height = this.options?.height / this.dpr + "px";
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
        const { mX, mY } = { mX: e.clientX, mY: e.clientY };
        _this.drag(mX - x, mY - y);
        x = mX;
        y = mY;
      }

      function onMouseUp(e?: MouseEvent) {
        _this.dragFlag = false;
        canvasEle.style.cursor = "default";
        console.log("CanvasPanel.dragFlag", _this.dragFlag);
        canvasEle.removeEventListener("mousemove", onMouseMove);
        canvasEle.removeEventListener("mouseup", onMouseUp);
        canvasEle.removeEventListener("mouseleave", onMouseLeave);
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

        document.getElementById(
          "zoom"
        ).innerHTML = `zoom: ${this.options.curZoom}`;
      },
      false
    );

    this.canvas.addEventListener("mousemove", (e: MouseEvent) => {
      document.getElementById("x").innerHTML = `x: ${e.offsetX}, `;
      document.getElementById("y").innerHTML = `y: ${e.offsetY}, `;
      document.getElementById(
        "zoom"
      ).innerHTML = `zoom: ${this.options.curZoom}`;
    });

    this.preventDefault();
  }

  draw() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(
      (this.options.width - 100) / this.dpr,
      (this.options.height - 100) / this.dpr,
      100,
      100
    );

    this.ctx.fillStyle = "red";
    this.ctx.fillRect(
      (this.options.width - 2) / this.dpr,
      (this.options.height - 2) / this.dpr,
      2,
      2
    );
  }
  /**
   * 滚轮缩放
   * @param offsetX 相对画布上鼠标的X轴
   * @param offsetY 相对画布上鼠标的Y轴
   * @param z 本次缩放的倍数（0.1/-0.1）
   * @returns
   */
  zoom(offsetX: number, offsetY: number, z: number) {
    this.options.curZoom = this.options.fontZoom + z;

    // curZoom 为负值时会发生翻转
    if (this.options.curZoom <= 0.3) {
      this.options.curZoom = this.options.fontZoom;
      return;
    }
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);

    // if (this.options.curZoom <= 1) {
    //   // 中心缩放
    //   this.options.translateX =
    //     this.options.translateX - (this.options.width / this.dpr) * z;
    //   this.options.translateY =
    //     this.options.translateY - (this.options.height / this.dpr) * z;
    // } else {
    // 最重要的是计算当前鼠标对应画布的真实位置
    // 偏移量加上鼠标位置除以上一次缩放的倍数（鼠标真实的位置）(-translateX + offsetX * dpr) / fontZoom
    this.options.translateX =
      this.options.translateX -
      ((-this.options.translateX + offsetX * this.dpr) /
        this.options.fontZoom) *
        z;
    this.options.translateY =
      this.options.translateY -
      ((-this.options.translateY + offsetY * this.dpr) /
        this.options.fontZoom) *
        z;
    // }
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
   * 平移
   * @param offsetX 鼠标X轴移动的差值
   * @param offsetY 鼠标Y轴移动的差值
   */
  drag(offsetX: number, offsetY: number) {
    if (this.dragFlag) {
      // 不用乘缩放倍数
      this.options.translateX = this.options.translateX + offsetX * this.dpr; // // 因为dpr
      this.options.translateY = this.options.translateY + offsetY * this.dpr;

      this.ctx.save();
      this.ctx.clearRect(0, 0, this.options.width, this.options.height);
      this.ctx.translate(this.options.translateX, this.options.translateY);
      this.ctx.scale(this.options.curZoom, this.options.curZoom);
      this.draw();
      this.ctx.restore();
    }
  }
  //
  preventDefault() {
    document.body.addEventListener("DOMMouseScroll", function (e) {
      e.preventDefault();
    });
    document.body.addEventListener(
      "mousewheel",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
      },
      { passive: false }
    );
  }
}

export default CanvasPanel;
