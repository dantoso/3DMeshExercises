function getMousePos(canvas, evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        X: evt.clientX - rect.left,
        Y: evt.clientY - rect.top
    };
  }

class SOREditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        canvas.addEventListener("contextmenu", function(e){ e.stopPropagation(); e.preventDefault(); return false; }); //Need this to disable the menu that pops up on right clicking
        this.points = [];
        canvas.addEventListener("mousedown", this.selectPoint.bind(this));
        canvas.addEventListener("touchstart", this.selectPoint.bind(this));
        this.NAngles = 20;
        this.repaint();
    }

    selectPoint(evt) {
        let mousePos = getMousePos(this.canvas, evt);
        let X = mousePos.X;
        let Y = mousePos.Y;
        let W = this.canvas.width;
        let H = this.canvas.height;
        let clickType = "LEFT";
        if (evt.which) {
            if (evt.which == 3) clickType = "RIGHT";
            if (evt.which == 2) clickType = "MIDDLE";
        }
        else if (evt.button) {
            if (evt.button == 2) clickType = "RIGHT";
            if (evt.button == 4) clickType = "MIDDLE";
        }
        if (clickType == "LEFT") {
            let p = glMatrix.vec3.fromValues(X-W/2, H-Y, 0);
            this.points.push(p);
        }
        else {
            this.points.pop();
        }
        this.repaint();
    }

    repaint() {
        let canvas = this.canvas;
        let ctx = this.ctx;
        let dW = 5;
        let W = canvas.width;
        let H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        ctx.beginPath();
        ctx.fillStyle = "black"
        ctx.moveTo(W/2, 0);
        ctx.lineTo(W/2, H);
        ctx.stroke();
        ctx.fillStyle = "red";
        this.points.forEach(function(p) {
            let x = p[0] + W/2;
            let y = H-p[1];
            ctx.fillRect(x-dW, y-dW, dW*2+1, dW*2+1);
        });
        ctx.fillStyle = "blue";
        for (let i = 0; i < this.points.length-1; i++) {
            let p1 = this.points[i];
            let p2 = this.points[i+1];
            ctx.beginPath();
            ctx.moveTo(p1[0]+W/2, H-p1[1]);
            ctx.lineTo(p2[0]+W/2, H-p2[1]);
            ctx.stroke();
        }
    }
}