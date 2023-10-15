import debounce from 'lodash-es/debounce';
import settings from './settings';
import loadFont from './utils/loadFont';
const {
  canvasHeight,
  canvasWidth,
  fontSize,
  font2Size,
  horizontalTilt,
  textBaseLine,
  graphOffset,
  text2Offset,
  paddingX,
  hollowPath,
} = settings;
const font = `${fontSize}px RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif`;

export default class LogoCanvas {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public textL = 'Blue';
  public textR = 'Archive';
  public textS = 'second';
  public text2Fonts = 'RoGSanSrfStd-Bd, GlowSansSC-Normal-Heavy_diff, apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif';
  private textMetricsL: TextMetrics | null = null;
  private textMetricsR: TextMetrics | null = null;
  private canvasWidth = canvasWidth;
  private canvasWidthL = canvasWidth / 2;
  private canvasWidthR = canvasWidth / 2;
  private textWidthL = 0;
  private textWidthR = 0;
  private text2Offset = text2Offset;
  private graphOffset = graphOffset;
  private transparentBg = false;

  private secondLineEnabled = false;
  private secondLineClip = false;

  private glowEnabled = false;

  private drawCanvas: HTMLCanvasElement;
  private drawCtx: CanvasRenderingContext2D;

  private debugEnabled = import.meta.env.DEV;
  
  constructor() {
    this.canvas = document.querySelector('#canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.canvas.height = canvasHeight;
    this.canvas.width = canvasWidth;
    this.bindEvent();

    this.drawCanvas = document.createElement('canvas');
    this.drawCtx = this.drawCanvas.getContext('2d')!;
  }
  async draw() {
    const loading = document.querySelector('#loading')!;

    try
    {
      const font2 = `${font2Size}px ${this.text2Fonts}`;

      loading.classList.remove('hidden');
      const d = this.drawCtx;
      const c = this.ctx;

      this.setErrorMsg(undefined);
      await loadFont(this.textL + this.textR + this.textS);

      d.font = font;
      this.textMetricsL = d.measureText(this.textL);
      this.textMetricsR = d.measureText(this.textR);
      this.setWidth();
      this.drawCanvas.height = this.canvas.height;
      //clear canvas
      d.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);

      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      //Background
      if (!this.transparentBg) {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
  
      const baseLineY = this.canvas.height * textBaseLine;
  
      //guide line
      if (this.debugEnabled) {
        d.strokeStyle = '#00cccc';
        d.lineWidth = 1;
        d.beginPath();
        d.moveTo(this.canvasWidthL, 0);
        d.lineTo(this.canvasWidthL, this.canvas.height);
        d.stroke();
        console.log(this.textMetricsL.width, this.textMetricsR.width);
        console.log(this.textWidthL, this.textWidthR);
        d.moveTo(this.canvasWidthL - this.textWidthL, 0);
        d.lineTo(this.canvasWidthL - this.textWidthL, this.canvas.height);
        d.moveTo(this.canvasWidthL + this.textWidthR, 0);
        d.lineTo(this.canvasWidthL + this.textWidthR, this.canvas.height);
        d.stroke();
  
        // Draw the text base line
        d.beginPath();
        d.moveTo(0, baseLineY);
        d.lineTo(this.canvasWidth, baseLineY);
        d.stroke();
      }
      //blue text -> halo -> black text -> cross
      d.font = font;
      d.fillStyle = '#128AFA';
      d.textAlign = 'end';
      d.setTransform(1, 0, horizontalTilt, 1, 0, 0);
      d.fillText(this.textL, this.canvasWidthL, this.canvas.height * textBaseLine);
      d.resetTransform(); //restore don't work
      d.drawImage(
        window.halo,
        this.canvasWidthL - this.canvas.height / 2 + this.graphOffset.X,
        this.graphOffset.Y,
        canvasHeight,
        canvasHeight
      );
      d.fillStyle = '#2B2B2B';
      d.textAlign = 'start';
      if (this.transparentBg) {
        d.globalCompositeOperation = 'destination-out';
      }
      d.strokeStyle = 'white';
      d.lineWidth = 12;
      d.setTransform(1, 0, horizontalTilt, 1, 0, 0);

      d.globalCompositeOperation = 'destination-out';
      d.strokeText(this.textR, this.canvasWidthL, this.canvas.height * textBaseLine);
      d.globalCompositeOperation = 'source-over';
      d.fillText(this.textR, this.canvasWidthL, this.canvas.height * textBaseLine);
      d.resetTransform();
  
      if (this.secondLineEnabled) {
        d.font = font2;
        
        if(this.secondLineClip)
        {
          d.save();
          d.rect(0, baseLineY, this.canvasWidth, this.canvas.height - baseLineY);
          d.clip();
        }
  
        d.setTransform(1, 0, horizontalTilt, 1, 0, 0);
        d.globalCompositeOperation = 'destination-out';
        //c.strokeText(this.textS, this.canvasWidthL - 200, this.canvas.height * textBaseLine - 200);
        d.strokeText(this.textS, this.canvasWidth - this.text2Offset.X, baseLineY + this.text2Offset.Y);
        d.globalCompositeOperation = 'source-over';
        d.fillText(this.textS, this.canvasWidth - this.text2Offset.X, baseLineY + this.text2Offset.Y);
        //c.fillText(this.textS, this.canvasWidthL - 200, this.canvas.height * textBaseLine - 200);
  
        d.resetTransform();
  
        if(this.secondLineClip)
        {
          d.restore();
        }
      }
  
      const graph = {
        X: this.canvasWidthL - this.canvas.height / 2 + graphOffset.X,
        Y: this.graphOffset.Y,
      };
      d.beginPath();
      d.moveTo(graph.X + hollowPath[0][0] / 2, graph.Y + hollowPath[0][1] / 2);
      d.lineTo(graph.X + hollowPath[1][0] / 2, graph.Y + hollowPath[1][1] / 2);
      d.lineTo(graph.X + hollowPath[2][0] / 2, graph.Y + hollowPath[2][1] / 2);
      d.lineTo(graph.X + hollowPath[3][0] / 2, graph.Y + hollowPath[3][1] / 2);
      d.closePath();

      d.globalCompositeOperation = 'destination-out';
      
      d.fillStyle = 'white';
      d.fill();
      d.globalCompositeOperation = 'source-over';
      d.drawImage(
        window.cross,
        this.canvasWidthL - this.canvas.height / 2 + graphOffset.X,
        this.graphOffset.Y,
        canvasHeight,
        canvasHeight
      );

      if(this.glowEnabled)
      {
        c.shadowBlur = 20;
        c.shadowColor = 'skyblue';
      }

      c.drawImage(this.drawCanvas, 0, 0);

      c.shadowBlur = 0;
    }
    catch (error) {
      console.log(error);
      this.setErrorMsg(error);
      return;
    } 
    finally
    {
      loading.classList.add('hidden');
    }

  }
  bindEvent() {
    const process = (id: 'textL' | 'textR' | 'textS' | 'text2Fonts', el: HTMLInputElement) => {
      this[id] = el.value;
      this.draw();
    };
    for (const t of ['textL', 'textR', 'textS', 'text2Fonts']) {
      const id = t as 'textL' | 'textR' | 'textS' | 'text2Fonts';
      const el = document.getElementById(id)! as HTMLInputElement;
      el.addEventListener('compositionstart', () => el.setAttribute('composing', ''));
      el.addEventListener('compositionend', () => {
        process(id, el);
        el.removeAttribute('composing');
      });
      el.addEventListener(
        'input',
        debounce(() => {
          if (el.hasAttribute('composing')) {
            return;
          }
          process(id, el);
        }, 300)
      );
    }

    document.querySelector('#save')!.addEventListener('click', () => this.saveImg());
    document.querySelector('#copy')!.addEventListener('click', () => this.copyImg());

    const tSwitch = document.querySelector('#transparent')! as HTMLInputElement;
    const secondLineSwitch = document.querySelector('#secondline')! as HTMLInputElement;
    const secondLineClipSwitch = document.querySelector('#secondlineclip')! as HTMLInputElement;
    const debugSwitch = document.querySelector('#debugswitch')! as HTMLInputElement;
    const glowSwitch = document.querySelector('#gloweffect')! as HTMLInputElement;

    // BRUH

    tSwitch.addEventListener('change', () => {
      this.transparentBg = tSwitch.checked;
      this.draw();
    });

    secondLineSwitch.addEventListener('change', () => {
      this.secondLineEnabled = secondLineSwitch.checked;
      this.draw();
    });

    secondLineClipSwitch.addEventListener('change', () => {
      this.secondLineClip = secondLineClipSwitch.checked;
      this.draw();
    });

    debugSwitch.addEventListener('change', () => {
      this.debugEnabled = debugSwitch.checked;
      this.draw();
    });

    glowSwitch.addEventListener('change', () => {
      this.glowEnabled = glowSwitch.checked;
      this.draw();
    });

    debugSwitch.checked = this.debugEnabled;

    const gx = document.querySelector('#graphX')! as HTMLInputElement;
    const gy = document.querySelector('#graphY')! as HTMLInputElement;

    const t2x = document.querySelector('#text2X')! as HTMLInputElement;
    const t2y = document.querySelector('#text2Y')! as HTMLInputElement;

    gx.addEventListener('input', () => {
      this.graphOffset.X = parseInt(gx.value);
      this.draw();
    });
    gy.addEventListener('input', () => {
      this.graphOffset.Y = parseInt(gy.value);
      this.draw();
    });

    t2x.addEventListener('input', () => {
      this.text2Offset.X = parseInt(t2x.value);
      this.draw();
    });
    t2y.addEventListener('input', () => {
      this.text2Offset.Y = parseInt(t2y.value);
      this.draw();
    });
  }
  setWidth() {
    this.textWidthL =
      this.textMetricsL!.width -
      (textBaseLine * canvasHeight + this.textMetricsL!.fontBoundingBoxDescent) * horizontalTilt;
    this.textWidthR =
      this.textMetricsR!.width +
      (textBaseLine * canvasHeight - this.textMetricsR!.fontBoundingBoxAscent) * horizontalTilt;
    //extend canvas
    if (this.textWidthL + paddingX > canvasWidth / 2) {
      this.canvasWidthL = this.textWidthL + paddingX;
    } else {
      this.canvasWidthL = canvasWidth / 2;
    }
    if (this.textWidthR + paddingX > canvasWidth / 2) {
      this.canvasWidthR = this.textWidthR + paddingX;
    } else {
      this.canvasWidthR = canvasWidth / 2;
    }
    
    const w = this.canvasWidthL + this.canvasWidthR;

    this.canvas.width = w;
    this.drawCanvas.width = w;
  }
  generateImg() {
    let outputCanvas: HTMLCanvasElement;
    if (
      this.textWidthL + paddingX < canvasWidth / 2 ||
      this.textWidthR + paddingX < canvasWidth / 2
    ) {
      outputCanvas = document.createElement('canvas');
      outputCanvas.width = this.textWidthL + this.textWidthR + paddingX * 2;
      outputCanvas.height = this.canvas.height;
      const ctx = outputCanvas.getContext('2d')!;
      ctx.drawImage(
        this.canvas,
        canvasWidth / 2 - this.textWidthL - paddingX,
        0,
        this.textWidthL + this.textWidthR + paddingX * 2,
        this.canvas.height,
        0,
        0,
        this.textWidthL + this.textWidthR + paddingX * 2,
        this.canvas.height
      );
    } else {
      outputCanvas = this.canvas;
    }
    return new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject();
        }
      });
    });
  }
  saveImg() {
    this.generateImg().then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.textL}${this.textR}_ba-style@nulla.top.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  async copyImg() {
    const blob = await this.generateImg();
    const cp = [new ClipboardItem({ 'image/png': blob })];
    navigator.clipboard
      .write(cp)
      .then(() => {
        console.log('image copied');
        const msg = document.querySelector('#message-switch') as HTMLInputElement;
        msg.checked = true;
        setTimeout(() => (msg.checked = false), 2000);
      })
      .catch((e) => console.error("can't copy", e));
  }

  setErrorMsg(text : unknown | undefined)
  {
    const errorBox = document.querySelector('#errorbox')! as HTMLInputElement;
    const errorText = document.querySelector('#errorbox-text')! as HTMLInputElement;

    if(text == undefined)
    {
      this.setClass(errorBox, 'hidden', true);
      return;
    }

    this.setClass(errorBox, 'hidden', false);
    errorText.innerText = text.toString();
  }

  setClass(dom : HTMLElement, cl : string, v : boolean)
  {
    if(v)
    {
      if(dom.classList.contains(cl))
        return;

      dom.classList.add(cl);
    }
    else{
      if(!dom.classList.contains(cl))
        return;

      dom.classList.remove(cl);
    }
  }
}
