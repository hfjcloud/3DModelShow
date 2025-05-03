// @charset "UTF-8";

const stoneImages = {
    '绉云峰': [
        'assert/images/绉云峰1.png',
        'assert/images/绉云峰2.png',
        'assert/images/绉云峰3.png'
    ],
    '蒋庄假山': [
        'assert/images/蒋庄假山1.png',
        'assert/images/蒋庄假山2.png',
        'assert/images/蒋庄假山3.png'
    ],
    '美女照镜': [
        'assert/images/美女照镜1.png',
        'assert/images/美女照镜2.png'
    ],
    '石湖蟹': [
        'assert/images/石湖蟹1.png',
        'assert/images/石湖蟹2.png'
    ],
    '神运石': [
        'assert/images/神运石1.png',
        'assert/images/神运石2.png'
    ],
    '绿云径': [
        'assert/images/绿云径1.png',
        'assert/images/绿云径2.png'
    ],
    '排衙石': [
        'assert/images/排衙石1.png',
        'assert/images/排衙石2.png'
    ],
    '寿石': [
        'assert/images/寿石1.png',
        'assert/images/寿石2.png'
    ],
    '仙人峰': [
        'assert/images/仙人峰1.png',
        'assert/images/仙人峰2.png'
    ]
};

class ImageSlideshow {
    constructor(stoneName, container) {
        this.container = container;
        this.stoneName = stoneName;
        this.currentIndex = 0;
        this.maxTries = 10;
        this.images = [];
        this.loadImages();
        
        // 添加点击事件处理
        const detailBtn = container.parentElement.querySelector('.detail-btn');
        detailBtn.onclick = () => {
            modal.show(stoneName, stoneDescriptions[stoneName], this.images);
        };
    }

    loadImages() {
        let loadedCount = 0;
        let loadingPromises = [];

        // 预加载所有图片
        for (let i = 1; i <= this.maxTries; i++) {
            const promise = new Promise((resolve) => {
                const img = new Image();
                img.src = `assert/images/${this.stoneName}${i}.png`;
                
                img.onload = () => {
                    this.images.push(img);
                    resolve(true);
                };

                img.onerror = () => {
                    resolve(false);
                };
            });
            loadingPromises.push(promise);
        }

        // 等待所有图片加载完成
        Promise.all(loadingPromises).then(() => {
            // 按文件名数字顺序排序图片
            this.images.sort((a, b) => {
                const numA = parseInt(a.src.match(/\d+\.png$/)[0]);
                const numB = parseInt(b.src.match(/\d+\.png$/)[0]);
                return numA - numB;
            });

            if (this.images.length > 0) {
                this.showImage(this.images[0]);
                if (this.images.length > 1) {
                    this.startSlideshow();
                }
            } else {
                // 如果没有图片加载成功，重试加载第一张
                const firstImg = new Image();
                firstImg.src = `assert/images/${this.stoneName}1.png`;
                firstImg.onload = () => {
                    this.images = [firstImg];
                    this.showImage(firstImg);
                };
            }
        });
    }

    showImage(img) {
        this.container.innerHTML = '';
        img.style.display = 'block';
        img.alt = this.stoneName;
        img.style.opacity = '1';
        img.style.position = 'absolute';
        this.container.appendChild(img);
    }

    startSlideshow() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // 将所有图片添加到容器中
        this.images.forEach((img, index) => {
            if (!this.container.contains(img)) {
                img.style.display = 'block';
                img.style.opacity = index === 0 ? '1' : '0';
                img.style.position = 'absolute';
                this.container.appendChild(img);
            }
        });

        this.intervalId = setInterval(() => {
            if (this.images.length <= 1) return;

            // 当前图片淡出
            this.images[this.currentIndex].style.opacity = '0';
            
            // 更新索引并显示下一张图片
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.images[this.currentIndex].style.opacity = '1';

            // 调试输出
            console.log(`${this.stoneName} - 切换到图片 ${this.currentIndex + 1}/${this.images.length}`);
        }, 5000);
    }
}

// 在 ImageSlideshow 类后添加模态框相关代码
class StoneModal {
    constructor() {
        this.modal = document.getElementById('stoneModal');
        this.title = this.modal.querySelector('.modal-title');
        this.text = this.modal.querySelector('.modal-text');
        this.images = this.modal.querySelector('.modal-images');
        this.closeBtn = this.modal.querySelector('.close-button');
        this.currentImageIndex = 0;
        this.imageInterval = null;
        this.modelContainer = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.model = null;
        this.controls = null;
        this.animationId = null;

        this.closeBtn.onclick = () => this.hide();
        window.onclick = (e) => {
            if (e.target === this.modal) this.hide();
        };

        // 添加模态框的鼠标事件阻止
        this.modal.addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });

        this.modal.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
    }

    show(stoneName, description, images) {
        this.title.textContent = stoneName;
        
        // 特殊处理蒋庄假山
        if (stoneName === '蒋庄假山') {
            this.text.style.display = 'none';  // 隐藏文字描述
            this.images.style.height = '100vh';  // 使用100vh占满全屏高度
            this.images.style.width = '100vw';   // 使用100vw占满全屏宽度
            this.images.style.margin = '0';      // 移除边距
            this.images.style.padding = '0';     // 移除内边距
            this.modal.style.padding = '0';      // 移除模态框内边距
        } else {
            this.text.style.display = 'block';  // 其他石头显示文字描述
            this.text.innerHTML = description;
            this.images.style.height = '';  // 恢复默认高度
        }

        this.images.innerHTML = '';

        // 只显示第一张图片
        const img = document.createElement('img');
        img.src = `assert/images/${stoneName}1.png`;
        img.alt = stoneName;
        img.style.opacity = '1';
        this.images.appendChild(img);

        // 显示模态框
        this.modal.style.display = 'block';
        
        // 处理3D模型展示的石头
        if (stoneName === '绉云峰' || stoneName === '蒋庄假山') {
            // 创建3D模型容器
            this.modelContainer = document.createElement('div');
            this.modelContainer.className = 'model-container';
            
            // 特殊处理蒋庄假山的容器样式
            if (stoneName === '蒋庄假山') {
                this.modelContainer.style.width = '100%';
                this.modelContainer.style.height = '90vh';
                this.modelContainer.style.margin = '0';
                this.modelContainer.style.position = 'relative';
                img.style.display = 'none';  // 隐藏图片
            }
            
            this.modelContainer.style.backgroundColor = '#E8D9B0';
            this.images.appendChild(this.modelContainer);

            // 等待DOM更新后初始化3D场景
            setTimeout(() => {
                this.initThreeJS();
                // 根据不同石头加载不同模型
                if (stoneName === '绉云峰') {
                    this.loadPLYModel('3DModels/ZYFH.ply');
                } else if (stoneName === '蒋庄假山') {
                    this.loadPLYModel('./3DModels/cloud.ply');
                }
            }, 100);
        }
        
        // 移除轮播相关代码
        if (this.imageInterval) {
            clearInterval(this.imageInterval);
            this.imageInterval = null;
        }
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);  // 改为深灰色背景

        // 优化相机设置
        const aspect = this.modelContainer.clientWidth / this.modelContainer.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 1000);
        this.camera.position.set(0, 5, 50);

        // 优化渲染器设置
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance",
            precision: "mediump",
            alpha: true  // 启用透明
        });
        this.renderer.setClearColor(0xE8D9B0, 1);  // 设置清除颜色
        this.renderer.setSize(this.modelContainer.clientWidth, this.modelContainer.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.shadowMap.enabled = false;
        this.modelContainer.appendChild(this.renderer.domElement);

        // 优化控制器设置
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.rotateSpeed = 0.8;
        this.controls.zoomSpeed = 0.8;
        this.controls.minDistance = 5;  // 改小最小距离，允许更近的观察
        this.controls.maxDistance = 200;  // 改大最大距离，允许更远的观察
        this.controls.enablePan = false;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 2.0;

        // 优化窗口调整处理
        let resizeTimeout;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.modelContainer) {
                    const width = this.modelContainer.clientWidth;
                    const height = this.modelContainer.clientHeight;
                    this.camera.aspect = width / height;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(width, height);
                }
            }, 100);
        });
    }

    loadPLYModel(modelPath) {
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.innerHTML = `
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <div class="loading-text">正在加载模型...</div>
        `;
        this.modelContainer.appendChild(loadingContainer);

        const progressBar = loadingContainer.querySelector('.loading-progress');
        const progressText = loadingContainer.querySelector('.loading-text');

        // 使用 fetch 先获取文件内容
        fetch(modelPath)
            .then(response => response.text())
            .then(data => {
                try {
                    // 手动解析 PLY 文件
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

                    // 解析顶点数据
                    let minY = Infinity;
                    let maxY = -Infinity;

                    // 第一次遍历找出y坐标的范围
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

                    // 创建 Three.js 几何体
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

                    // 创建点云材质
                    const material = new THREE.PointsMaterial({
                        size: 0.01,
                        vertexColors: true,  // 启用顶点颜色
                        sizeAttenuation: true
                    });

                    // 创建点云对象
                    this.model = new THREE.Points(geometry, material);
                    
                    // 计算包围盒并调整视图
                    const box = new THREE.Box3().setFromObject(this.model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    // 调整缩放
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 20.0 / maxDim;
                    this.model.scale.multiplyScalar(scale);
                    
                    // 居中模型
                    this.model.position.copy(center).multiplyScalar(-scale);
                    
                    // 调整相机
                    this.camera.position.set(0, 0, 20);
                    this.camera.lookAt(0, 0, 0);
                    
                    // 清除场景并添加新模型
                    while(this.scene.children.length > 0) {
                        this.scene.remove(this.scene.children[0]);
                    }
                    
                    this.scene.add(this.model);
                    
                    // 移除加载提示
                    loadingContainer.remove();
                    
                    // 开始动画
                    this.animate();
                    
                } catch (error) {
                    console.error('解析模型时出错:', error);
                    this.showErrorMessage(loadingContainer);
                }
            })
            .catch(error => {
                console.error('加载文件时出错:', error);
                this.showErrorMessage(loadingContainer);
            });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.controls.enabled) {
            this.controls.update();
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    hide() {
        try {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            if (this.renderer && this.renderer.domElement) {
                this.renderer.dispose();
                this.renderer.domElement.remove();
                this.renderer = null;
            }
            
            if (this.controls) {
                this.controls.dispose();
                this.controls = null;
            }
            
            if (this.scene && Array.isArray(this.scene.children)) {
                while(this.scene.children && this.scene.children.length > 0) { 
                    const object = this.scene.children[0];
                    if (object.geometry) {
                        object.geometry.dispose();
                    }
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                    this.scene.remove(object);
                }
                this.scene = null;
            }
            
            this.camera = null;
            this.model = null;
            this.modal.style.display = 'none';
            
            if (this.imageInterval) {
                clearInterval(this.imageInterval);
                this.imageInterval = null;
            }
        } catch (error) {
            console.error('清理场景时出错:', error);
            // 确保模态框被隐藏
            this.modal.style.display = 'none';
        }
    }

    // 添加一个显示错误信息的辅助方法
    showErrorMessage(container) {
        container.innerHTML = `
            <div class="error-placeholder" style="color: red; padding: 20px; text-align: center;">
                3D模型加载失败<br>
                请检查模型文件格式是否正确
            </div>
        `;
    }
}

// 修改 stoneDescriptions 对象，添加所有石头的描述
const stoneDescriptions = {
    '绉云峰': String.raw`绉云峰位于杭州市西湖区竹素园内，是一座高2.6米，狭腰仅0.4米的英石峰，为江南三大名石之一。石的表面布满了皱裥，而这些石皱的纹理却是斜向平行的。在曲折而上的石峰表面，宛如波光水影，层层而起，一脉置顶，有形同云立，纹比波摇的特色，"其色如铁，具纤回峭折之致，有佩氛绵联之状"，是石中罕见之珍品。
关于绉云峰的来历，记载有这样一段故事：传说明末清初，海宁人查继佐救助了沦为乞丐的吴六奇，两人相交甚欢成为好友。后吴六奇参军立功，升广东水陆提督，邀请查继佐到广东游玩。一日，查继佐于吴六奇园府内看见一座英石峰，顿觉有"金风玉露一相逢"的惊喜，便提笔题了"绉云"二字。吴六奇见友人喜爱，便命人打包将石头运至查继佐家乡。清代《聊斋志异》、《香祖笔记》、《粤屑》、《海昌胜迹记》等书都曾有关于绉云峰的记载。道光年间，一个叫蔡广文的人以千金购得此石，安置于浙江崇德福严寺中。1963年，绉云峰移至杭州花圃，为便于人们观赏，1996年绉云峰又被移至"竹素园"盆景园内。并以"江南名石苑"命名。绉云峰便被安排在竹素园西，配以盆景，供人欣赏。`,
    '仙人峰': `仙人峰位于杭州市西湖区文澜阁藏书楼南部山池庭院中，是一座高6.3 米的太湖石峰。此石形态优美，苗条多姿，上大下小，石身起伏不平，有明显的节奏变化，身上的孔穴巧妙相通。仙人峰最佳观赏面朝北，面向文澜阁主体建筑。自藏书楼前平台南视，仙人峰置于湖石基座上，周边的湖石驳岸高低起伏，与仙人峰形成高低横竖的对比，突出了仙人峰曼妙的身姿。自文澜阁厅内南视，因精准的距离控制，可将仙人峰完整收入门框之内，通过室内外的明暗对比，以突出峰石的效果。
关于这块奇石的来历，《华亭县志》卷二十一载："熙园万米峰，乾隆庚子南巡，浙商购置杭州行宫。"文澜阁于1784年建成，而乾隆庚子南巡为1780年，此时的文澜阁之址为西湖行宫，而上述的熙园是明代光禄丞顾正心位于上海松江的私园。明代张宝臣《熙园记》载"堂前一巨石，高十丈许，四面玲珑"就是现在的"仙人峰"。`,
    '美女照镜': `美女照镜石位于杭州市西湖区杭州花圃，原名"太师少帅石"，高近4米，重2万余斤，色灰白。石体透漏天成、遍布穴窍，轮廓线条曲折突兀，从石头的右侧上方角度观之如同美人捧镜梳理妆容，由此得名据称该石为清同治年间的遗存，1964年搬移至浙江杭州，今置放在杭州市龙井路杭州花圃西大门内一水池的东北角。`,
    '石湖蟹': `石湖蟹（又名"石如意"），是位于杭州市西湖区陈庄（陈曾寿故居）中，长约2m，高约1m的太湖石，现在是原来陈庄唯一的遗物。关于这块太湖石名字的来历有二：其一，两头翘起像湖蟹的大钳子，于是名其"石湖蟹"；其二，陈曾寿认为其书斋要有书卷气，也要吉祥如意，于是为书斋取名"石如意"，这块石头也叫"石如意"，游客一般还是叫"石湖蟹"。
这块太湖石的历史背景可以追溯到陈庄的旧址，它曾是陈曾寿故居的园林景观的一部分。根据相关记载，这块石头原本位于桃源岭一带，在进行整治时受到了大家的高度评价。于是，这块石头被搬到了新的位置，并被安置在了陈庄，成为陈庄园林景观的重要一环。`,
    '神运石': `神运石是位于杭州市西湖区龙井问茶的一块名石，约2米高。兀立在龙井泉池旁，石体瘦硬，状若游龙，岩状结构与龙井所在的山体同为石灰岩。
根据相关史料记载，神运石原在龙井泉池中，明正统十三年(1448)淘井时，由八十名大力士一起发力，才从井中将这块约有一人高、状若矫龙的奇石取出。因石上原刻有行草书的"嶻镍神运石下有玉泓池"十字，故名"神运石"。石上题刻纵横有法，"运"、"池"二字独大，酷似"宋四家"之一米芾的手笔。神运石出水后，置放在龙井泉池旁的龙祠檐下，当时寺僧曾在石旁种植攀援植物木香一架，让藤蔓缠绕于石上，细枝甚至穿过石上孔窍，宛若有龙蟠踞。乾隆第三次南巡时，在龙井逗留许久，将神运石列为"龙井八景"之一，又在石上题刻诗句。目前除了乾隆题刻外，也有一些明代题记残留下来。`,
    '绿云径': `绿云径位于杭州市西湖区孤山山脊，是一组高6米的遗存太湖石假山原物，原为清乾隆帝御题"行宫八景"之一。远远望去，仿佛石浮动在孤山顶上的朵朵青云，道路两旁的松树虽已不存，但仍能体验到其山间清幽湿润之气。
这组假山上还保留着四块乾隆御题诗文石刻。其中一块石刻高47.5厘米，宽103厘米，行书，撰于清乾隆十六年（1751），碑文："径纡探绝胜，森秀入苍云。苔迹时留印，樵斤未许闻。蒙蒙湿鹤毳，濯濯润螺纹。谢傅东山好，微嫌丝竹纷。"深动描绘出此地密林笼翠，烟云滋润的景象。`,
    '排衙石': `排衙石位于杭州市上城区南宋皇城背靠的凤凰山上，是两排规则排列的自然石笋林，排衙石周边的地形较平坦、略有起伏。其中最高的一组达到4m高，而据历史记载"最小一支形如芝，高丈许"，也就是当年最小的也有3m多高。
其名称的由来，最早与五代吴越国的国王钱镠有关，据《淳祐临安志》记载，"旧传钱武肃王凿山，见怪石排列两行，如从卫拱立趋向，因名排衙石"，国王钱缪觉得它很像亲兵排列，即命名为"排衙石"。"衙"同"牙"，指牙兵，也就是现在士兵的意思，因此"排衙石"又称"排牙石"。杜绾在《云林石谱》中称:"临安府府署之侧，一山甚高，名拜郊台，吴越钱氏故迹。山巅险峻处，两边各有列石数十块从地生出者，峰峦巉岩，穿眼委曲，翠润而坚，谓之排牙石。"排牙即排衙，杜绾所见排衙石有数十块之多，今日所见，仅有十余，拔地从生，仍堪称奇景。`,
    '寿石': `寿石位于胡雪岩故居后花园东、西两面厅中间的中庭，是一座高约4米的太湖石峰。这块寿石是胡雪岩耗资几万两，从太湖运至故居，作为其送与母亲八十大寿的寿礼，同时也是胡家的镇宅之宝，也象征着胡雪岩对母亲的深厚孝心。
寿石之所以得名"寿石"，是因为其外形酷似"夀"字，正寓意"寿比南山"，象征长寿与吉祥。寿石的独特造型在园中显得尤为引人注目，背靠高墙，犹如一幅立体画，给人稳重有依靠之感，象征着有"靠山"之意，寓意家族的兴旺与稳固。在寿石附近的园地上有用鹅卵石铺成的元宝盆和两个铜钱的图案，又寓意"财寿兼得"，象征着财富与长寿并驾齐驱，表露了胡雪岩对家族繁荣和母亲长寿的美好祝愿。`,
    '蒋庄假山': `蒋庄大假山位于杭州市西湖区蒋庄内，为太湖石山水假山，平面呈三角形，南北宽约15米，东西宽约13米，山势呈东北——西南走向，主峰高约3.2米，占地面积约150平方米。整座假山均选用太湖石料，运用旱地堆叠手法，东侧紧挨自然居南墙，主峰和次峰前后相错，嶙峋奇耸，整体呈围合环抱之势。因缺少明确可考的资料仅能推测该处假山始建于民国初年，或为"金华帮""宁波帮"等浙中叠石帮派所叠、后在20世纪60年代由杭州市园林管理局的第二代假山工匠张金如先生、陈大伟先生等修复。
该假山主要艺术特征为：描摹真山，道法自然；借势造景，情景交融；嶙峋奇耸，趣味横生。假山下洞上台，顶部与自然居的南墙相接，循磴道而上，至山顶小台，似可通自然居建筑二层，亦可驻足俯小院全景。假山以墙为底，立峰作图，工法精巧，主次结合，虚实相生。山洞采用拱券式叠法，前后设两个洞口，洞内形态似真山山洞，洞壁多有开孔，利于通风采光。山洞内部有一磴道通往山腰的小平台，平台中间设一石桌，再往上即可达山顶。整座假山好似蒋庄中一座令人叫绝的天然山水大盆景，融汇在西湖的湖光山色之中。`
};

// 初始化所有石头的轮播
document.addEventListener('DOMContentLoaded', () => {
    const stoneNames = [
        '绉云峰', '蒋庄假山', '美女照镜', '石湖蟹', 
        '神运石', '绿云径', '排衙石', '寿石', '仙人峰'
    ];
    const slideshowContainers = document.querySelectorAll('.stone-image');
    stoneNames.forEach((name, index) => {
        new ImageSlideshow(name, slideshowContainers[index]);
    });
});
// 创建模态框实例
const modal = new StoneModal();