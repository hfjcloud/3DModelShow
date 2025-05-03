class ModelViewer {
    constructor() {
        this.container = document.getElementById('modelContainer');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.animationId = null;
        this.currentModelIndex = 1;  // 当前显示的模型编号
        this.isTransitioning = false;  // 是否正在过渡
        this.nextModel = null;  // 用于存储预加载的下一个模型

        this.init();
        this.loadModel('cloud1.ply');  // 首先加载 cloud1.ply
        
        // 提前加载下一个模型
        setTimeout(() => {
            this.preloadNextModel('cloud2.ply');
        }, 15000);  // 15秒时开始预加载
        
        // 20秒时开始切换动画
        setTimeout(() => {
            this.switchToNextModel();
        }, 20000);
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);

        // 创建相机
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
        this.camera.position.set(0, 20, 0);
        this.camera.up.set(0, 0, 1);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            precision: "mediump"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // 创建控制器
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 200;
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2.0;
        
        // 设置控制器的向上方向为 Z 轴
        this.controls.object.up.set(0, 0, 1);

        // 添加窗口调整监听
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    preloadNextModel(modelPath) {
        fetch(`./3DModels/${modelPath}`)
            .then(response => response.text())
            .then(data => {
                try {
                    const lines = data.split('\n');
                    let vertexCount = 0;
                    let headerEnd = 0;
                    
                    // 解析头部
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line === 'end_header') {
                            headerEnd = i + 1;
                            break;
                        }
                        if (line.startsWith('element vertex')) {
                            vertexCount = parseInt(line.split(' ')[2]);
                        }
                    }

                    // 找出y坐标的范围
                    let minY = Infinity;
                    let maxY = -Infinity;
                    for (let i = 0; i < vertexCount; i++) {
                        const values = lines[headerEnd + i].trim().split(' ');
                        const y = parseFloat(values[1]);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }

                    // 创建顶点数据和颜色数据
                    const positions = new Float32Array(vertexCount * 3);
                    const colors = new Float32Array(vertexCount * 3);
                    
                    // 解析顶点数据并设置颜色
                    for (let i = 0; i < vertexCount; i++) {
                        const values = lines[headerEnd + i].trim().split(' ');
                        positions[i * 3] = parseFloat(values[0]);
                        positions[i * 3 + 1] = parseFloat(values[1]);
                        positions[i * 3 + 2] = parseFloat(values[2]);
                        
                        // 计算当前点的高度比例
                        const normalizedY = (parseFloat(values[1]) - minY) / (maxY - minY);
                        
                        // 设置从蓝色到绿色的渐变
                        colors[i * 3] = 0.0;  // R = 0
                        colors[i * 3 + 1] = normalizedY;  // G: 从0到1
                        colors[i * 3 + 2] = 1 - normalizedY;  // B: 从1到0
                    }

                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                    const material = new THREE.PointsMaterial({
                        size: 0.01,
                        vertexColors: true,
                        sizeAttenuation: true,
                        transparent: true,
                        opacity: 0  // 初始完全透明
                    });

                    this.nextModel = new THREE.Points(geometry, material);
                    
                    // 应用与当前模型相同的变换
                    if (this.model) {
                        this.nextModel.position.copy(this.model.position);
                        this.nextModel.rotation.copy(this.model.rotation);
                        this.nextModel.scale.copy(this.model.scale);
                    } else {
                        const box = new THREE.Box3().setFromObject(this.nextModel);
                        const size = box.getSize(new THREE.Vector3());
                        const center = box.getCenter(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const scale = 20.0 / maxDim;
                        this.nextModel.scale.multiplyScalar(scale);
                        this.nextModel.position.copy(center).multiplyScalar(-scale);
                    }
                    
                    // 先不添加到场景中
                } catch (error) {
                    console.error('预加载模型时出错:', error);
                }
            });
    }

    switchToNextModel() {
        if (!this.nextModel || this.isTransitioning) return;
        this.isTransitioning = true;

        // 添加预加载的模型到场景中
        this.scene.add(this.nextModel);

        // 确保两个模型的材质都启用了透明度
        this.model.material.transparent = true;
        this.nextModel.material.transparent = true;
        
        // 设置材质的混合模式
        this.model.material.blending = THREE.NormalBlending;
        this.nextModel.material.blending = THREE.NormalBlending;
        
        // 设置渲染顺序，确保透明物体正确渲染
        this.model.renderOrder = 1;
        this.nextModel.renderOrder = 2;

        // 设置初始透明度
        this.model.material.opacity = 1;
        this.nextModel.material.opacity = 0;

        // 创建动画函数
        const fadeSpeed = 0.005;  // 减小速度，使过渡更慢
        let elapsed = 0;
        
        const animate = () => {
            if (!this.model || !this.nextModel) return;

            elapsed += fadeSpeed;
            
            // 使用正弦函数使过渡更平滑
            const fadeOut = Math.cos(elapsed * Math.PI / 2);
            const fadeIn = Math.sin(elapsed * Math.PI / 2);
            
            // 更新透明度
            this.model.material.opacity = Math.max(0, fadeOut);
            this.nextModel.material.opacity = Math.min(1, fadeIn);

            if (elapsed >= 1) {
                // 切换完成
                this.scene.remove(this.model);
                if (this.model.geometry) this.model.geometry.dispose();
                if (this.model.material) this.model.material.dispose();
                
                this.model = this.nextModel;
                this.model.material.transparent = false;  // 切换完成后禁用透明度以提高性能
                this.model.material.opacity = 1;
                this.nextModel = null;
                this.isTransitioning = false;
                return;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    loadModel(modelPath) {
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <div class="loading-text">正在加载模型...</div>
        `;
        this.container.appendChild(loadingContainer);

        const progressBar = loadingContainer.querySelector('.loading-progress');
        const progressText = loadingContainer.querySelector('.loading-text');

        fetch(`./3DModels/${modelPath}`)
            .then(response => response.text())
            .then(data => {
                try {
                    const lines = data.split('\n');
                    let vertexCount = 0;
                    let headerEnd = 0;
                    
                    // 解析头部
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line === 'end_header') {
                            headerEnd = i + 1;
                            break;
                        }
                        if (line.startsWith('element vertex')) {
                            vertexCount = parseInt(line.split(' ')[2]);
                        }
                    }

                    // 找出y坐标的范围
                    let minY = Infinity;
                    let maxY = -Infinity;
                    for (let i = 0; i < vertexCount; i++) {
                        const values = lines[headerEnd + i].trim().split(' ');
                        const y = parseFloat(values[1]);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }

                    // 创建顶点数据和颜色数据
                    const positions = new Float32Array(vertexCount * 3);
                    const colors = new Float32Array(vertexCount * 3);
                    
                    // 解析顶点数据并设置颜色
                    for (let i = 0; i < vertexCount; i++) {
                        const values = lines[headerEnd + i].trim().split(' ');
                        positions[i * 3] = parseFloat(values[0]);
                        positions[i * 3 + 1] = parseFloat(values[1]);
                        positions[i * 3 + 2] = parseFloat(values[2]);
                        
                        // 计算当前点的高度比例
                        const normalizedY = (parseFloat(values[1]) - minY) / (maxY - minY);
                        
                        // 设置从蓝色到绿色的渐变
                        colors[i * 3] = 0.0;  // R = 0
                        colors[i * 3 + 1] = normalizedY;  // G: 从0到1
                        colors[i * 3 + 2] = 1 - normalizedY;  // B: 从1到0
                    }

                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                    const material = new THREE.PointsMaterial({
                        size: 0.01,
                        vertexColors: true,
                        sizeAttenuation: true,
                        transparent: true,  // 启用透明度
                        opacity: 1  // 初始完全不透明
                    });

                    this.model = new THREE.Points(geometry, material);
                    
                    const box = new THREE.Box3().setFromObject(this.model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 20.0 / maxDim;
                    this.model.scale.multiplyScalar(scale);
                    
                    this.model.position.copy(center).multiplyScalar(-scale);
                    
                    this.scene.add(this.model);
                    
                    loadingContainer.remove();
                    
                    this.animate();
                    
                } catch (error) {
                    console.error('解析模型时出错:', error);
                    this.showErrorMessage(loadingContainer);
                    this.isTransitioning = false;
                }
            })
            .catch(error => {
                console.error('加载文件时出错:', error);
                this.showErrorMessage(loadingContainer);
                this.isTransitioning = false;
            });
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    showErrorMessage(container) {
        container.innerHTML = `
            <div class="error-placeholder" style="color: red; padding: 20px; text-align: center;">
                3D模型加载失败<br>
                请检查模型文件格式是否正确
            </div>
        `;
    }
}

// 初始化查看器
document.addEventListener('DOMContentLoaded', () => {
    new ModelViewer();
}); 