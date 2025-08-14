<template>
  <div class="food-map-container">
    <div id="webgl" ref="canvasContainer" class="food-map"></div>
    <div class="loading" v-if="loading">加载冰箱模型中...</div>
    <div class="error" v-if="error">{{ error }}</div>
    <!-- 收纳式提示面板 - 左侧 -->
    <div class="controls-hint" :class="{ 'collapsed': isHintCollapsed }">
      <div class="hint-toggle" @click="toggleHint">
        <div class="toggle-icon">{{ isHintCollapsed ? '▶' : '◀' }}</div>
      </div>
      <div class="hint-content" v-show="!isHintCollapsed">
        <div class="hint-title">🏠 智能厨房</div>
        <div class="hint-item">
          <span class="hint-icon">🖱️</span>
          <span>拖拽旋转视角</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">🔍</span>
          <span>滚轮缩放</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">🚪</span>
          <span>点击冰箱门打开/关闭</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">🧊</span>
          <span>点击冰柜盖子打开/关闭</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">❄️</span>
          <span>查看丰富的食物存储</span>
        </div>
        <div class="hint-item">
          <span class="hint-icon">✨</span>
          <span>专业级3D建模效果</span>
        </div>
      </div>
    </div>

    <!-- 设备选择器 - 右侧 -->
    <div class="device-selector" :class="{ 'collapsed': isSelectorCollapsed }">
      <div class="selector-toggle" @click="toggleSelector">
        <div class="toggle-icon">{{ isSelectorCollapsed ? '◀' : '▶' }}</div>
      </div>
      <div class="selector-content" v-show="!isSelectorCollapsed">
        <div class="selector-title">选择设备</div>
        <div class="selector-buttons">
          <button class="selector-btn" :class="{ active: currentDevice === 'fridge' }" @click="switchDevice('fridge')">
            🧊 冰箱
          </button>
          <button class="selector-btn" :class="{ active: currentDevice === 'freezer' }"
            @click="switchDevice('freezer')">
            ❄️ 冰柜
          </button>
        </div>
        <div class="food-count" v-if="foodData.length > 0">
          <div class="count-item">
            <span class="count-icon">📦</span>
            <span>共 {{ foodData.length }} 种食物</span>
          </div>
          <button class="refresh-btn" @click="loadFoodData" title="刷新食物数据">
            🔄
          </button>

        </div>
      </div>
    </div>

    <!-- 食物信息面板 -->
    <div class="food-info-panel" v-if="selectedFood" @click="selectedFood = null">
      <div class="food-info-content" @click.stop>
        <div class="food-info-header">
          <h3>{{ selectedFood.name }}</h3>
          <button class="close-btn" @click="selectedFood = null">×</button>
        </div>
        <div class="food-info-body">
          <div class="info-item">
            <span class="info-label">类别:</span>
            <span class="info-value">{{ selectedFood.category }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">存储位置:</span>
            <span class="info-value">{{ selectedFood.storageLocation }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">购买日期:</span>
            <span class="info-value">{{ selectedFood.purchaseDate }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">过期时间:</span>
            <span class="info-value" :class="{ 'expired': isExpired(selectedFood.expireDate) }">
              {{ selectedFood.expireDate }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">数量:</span>
            <span class="info-value">{{ selectedFood.quantity }} {{ selectedFood.unit }}</span>
          </div>
          <div class="info-item" v-if="selectedFood.description">
            <span class="info-label">描述:</span>
            <span class="info-value">{{ selectedFood.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default {
  setup() {
    const canvasContainer = ref(null)
    const loading = ref(true)
    const error = ref('')
    const isHintCollapsed = ref(false)
    const isSelectorCollapsed = ref(false)
    const currentDevice = ref('fridge')
    const selectedFood = ref(null)

    let scene, camera, renderer, controls
    let animationId
    let fridgeModel = null
    let freezerModel = null
    let upperDoor = null
    let lowerDoor = null
    let raycaster = new THREE.Raycaster()
    let mouse = new THREE.Vector2()
    let isUpperDoorOpen = false
    let isLowerDoorOpen = false
    let isFreezerLidOpen = false
    let originalCameraPosition = new THREE.Vector3()
    let originalCameraTarget = new THREE.Vector3()
    let isInspectMode = false

    // 食物数据和3D对象
    const foodData = ref([])
    const foodObjects = ref(new Map()) // 存储食物3D对象的映射
    let dynamicFoodGroup = null // 动态食物组

    onMounted(() => {
      initThreeJS()
      loadFridgeModel()
      loadFoodData()
    })

    const initThreeJS = () => {
      // 创建场景
      scene = new THREE.Scene()

      // 创建渐变背景
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const context = canvas.getContext('2d')
      const gradient = context.createLinearGradient(0, 0, 0, 512)
      gradient.addColorStop(0, '#87CEEB') // 天空蓝
      gradient.addColorStop(0.5, '#E0F6FF') // 浅蓝白
      gradient.addColorStop(1, '#F0F8FF') // 爱丽丝蓝
      context.fillStyle = gradient
      context.fillRect(0, 0, 512, 512)

      const backgroundTexture = new THREE.CanvasTexture(canvas)
      scene.background = backgroundTexture

      // 创建相机
      const container = canvasContainer.value
      const width = container.clientWidth
      const height = container.clientHeight

      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.set(3, 3, 6)

      // 创建渲染器
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.outputEncoding = THREE.sRGBEncoding
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.2

      // 添加渲染器到DOM
      container.appendChild(renderer.domElement)

      // 添加轨道控制器
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.enableZoom = true
      controls.enablePan = true
      controls.maxPolarAngle = Math.PI * 0.8
      controls.minDistance = 2
      controls.maxDistance = 15

      // 创建更丰富的光照系统
      // 主环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
      scene.add(ambientLight)

      // 主方向光（模拟阳光）
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.2)
      mainLight.position.set(8, 12, 6)
      mainLight.castShadow = true
      mainLight.shadow.mapSize.width = 4096
      mainLight.shadow.mapSize.height = 4096
      mainLight.shadow.camera.near = 0.1
      mainLight.shadow.camera.far = 50
      mainLight.shadow.camera.left = -10
      mainLight.shadow.camera.right = 10
      mainLight.shadow.camera.top = 10
      mainLight.shadow.camera.bottom = -10
      mainLight.shadow.bias = -0.0001
      scene.add(mainLight)

      // 补充光源（模拟室内照明）
      const fillLight = new THREE.DirectionalLight(0xfff8dc, 0.6)
      fillLight.position.set(-5, 8, -3)
      scene.add(fillLight)

      // 点光源（增加层次感）
      const pointLight = new THREE.PointLight(0xffffff, 0.8, 20)
      pointLight.position.set(2, 4, 4)
      pointLight.castShadow = true
      scene.add(pointLight)

      // 创建现代厨房地面
      const floorGeometry = new THREE.PlaneGeometry(25, 25)

      // 创建地板纹理
      const floorCanvas = document.createElement('canvas')
      floorCanvas.width = 512
      floorCanvas.height = 512
      const floorContext = floorCanvas.getContext('2d')

      // 绘制瓷砖效果
      floorContext.fillStyle = '#f8f8f8'
      floorContext.fillRect(0, 0, 512, 512)

      // 添加瓷砖网格
      floorContext.strokeStyle = '#e0e0e0'
      floorContext.lineWidth = 2
      for (let i = 0; i <= 8; i++) {
        const pos = (i / 8) * 512
        floorContext.beginPath()
        floorContext.moveTo(pos, 0)
        floorContext.lineTo(pos, 512)
        floorContext.stroke()

        floorContext.beginPath()
        floorContext.moveTo(0, pos)
        floorContext.lineTo(512, pos)
        floorContext.stroke()
      }

      const floorTexture = new THREE.CanvasTexture(floorCanvas)
      floorTexture.wrapS = THREE.RepeatWrapping
      floorTexture.wrapT = THREE.RepeatWrapping
      floorTexture.repeat.set(4, 4)

      const floorMaterial = new THREE.MeshLambertMaterial({
        map: floorTexture,
        color: 0xffffff
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.receiveShadow = true
      scene.add(floor)

      // 添加厨房背景墙
      const wallGeometry = new THREE.PlaneGeometry(25, 15)
      const wallMaterial = new THREE.MeshLambertMaterial({
        color: 0xf5f5f5,
        transparent: true,
        opacity: 0.8
      })
      const backWall = new THREE.Mesh(wallGeometry, wallMaterial)
      backWall.position.set(0, 7.5, -8)
      backWall.receiveShadow = true
      scene.add(backWall)

      // 添加一些装饰性的厨房元素
      createKitchenDecoration()

      // 处理窗口大小变化
      const handleResize = () => {
        const width = container.clientWidth
        const height = container.clientHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }
      window.addEventListener('resize', handleResize)

      // 添加鼠标点击事件
      const onMouseClick = (event) => {
        const rect = container.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        raycaster.setFromCamera(mouse, camera)

        // 首先检查食物交互
        if (dynamicFoodGroup) {
          const foodIntersects = raycaster.intersectObjects(dynamicFoodGroup.children, true)
          if (foodIntersects.length > 0) {
            handleFoodInteraction(event)
            return // 如果点击了食物，不处理其他交互
          }
        }

        // 检查冰箱交互
        if (fridgeModel) {
          const intersects = raycaster.intersectObjects(fridgeModel.children, true)

          if (intersects.length > 0) {
            const clickedObject = intersects[0].object

            // 检查点击的是否是门或把手
            let clickedGroup = clickedObject
            while (clickedGroup.parent && clickedGroup.parent !== fridgeModel) {
              clickedGroup = clickedGroup.parent
            }

            if (clickedGroup === fridgeModel.upperDoorGroup) {
              toggleUpperDoor()
              return
            } else if (clickedGroup === fridgeModel.lowerDoorGroup) {
              toggleLowerDoor()
              return
            }
          }
        }

        // 检查冰柜交互
        if (freezerModel) {
          const freezerIntersects = raycaster.intersectObjects(freezerModel.children, true)

          if (freezerIntersects.length > 0) {
            const clickedObject = freezerIntersects[0].object

            // 检查点击的是否是冰柜盖子
            let clickedGroup = clickedObject
            while (clickedGroup.parent && clickedGroup.parent !== freezerModel) {
              clickedGroup = clickedGroup.parent
            }

            if (clickedGroup === freezerModel.lidGroup) {
              toggleFreezerLid()
              return
            }
          }
        }
      }

      container.addEventListener('click', onMouseClick)
      container.addEventListener('mousemove', handleFoodInteraction)

      // 动画循环
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }
      animate()

      // 保存初始相机位置
      originalCameraPosition.copy(camera.position)
      originalCameraTarget.copy(controls.target)

      // 清理函数
      onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        container.removeEventListener('click', onMouseClick)
        container.removeEventListener('mousemove', handleFoodInteraction)
        cancelAnimationFrame(animationId)
        if (controls) controls.dispose()
        if (renderer) {
          renderer.dispose()
          container.removeChild(renderer.domElement)
        }
      })
    }

    const loadFridgeModel = () => {
      const loader = new GLTFLoader()

      // 尝试加载不同格式的冰箱模型文件
      const modelPaths = [
        '/fridge.glb',
        '/fridge.gltf',
        '/models/fridge.glb',
        '/models/fridge.gltf'
      ]



      const tryLoadModel = (pathIndex = 0) => {
        if (pathIndex >= modelPaths.length) {
          // 如果所有路径都失败了，创建一个简单的冰箱替代品
          createFallbackFridge()
          return
        }

        loader.load(
          modelPaths[pathIndex],
          (gltf) => {
            fridgeModel = gltf.scene

            // 调整模型大小和位置
            const box = new THREE.Box3().setFromObject(fridgeModel)
            const size = box.getSize(new THREE.Vector3())
            const maxSize = Math.max(size.x, size.y, size.z)
            const scale = 2 / maxSize
            fridgeModel.scale.setScalar(scale)

            // 居中模型
            const center = box.getCenter(new THREE.Vector3())
            fridgeModel.position.sub(center.multiplyScalar(scale))
            fridgeModel.position.y = size.y * scale / 2

            // 启用阴影
            fridgeModel.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            scene.add(fridgeModel)
            loading.value = false

          },
          (progress) => {

          },
          (err) => {

            tryLoadModel(pathIndex + 1)
          }
        )
      }

      tryLoadModel()
    }

    const createFallbackFridge = () => {

      // 创建冰箱组
      const fridgeGroup = new THREE.Group()

      // 升级材质定义 - 使用更现代的材质
      const materials = {
        body: new THREE.MeshPhongMaterial({
          color: 0xf8f8f8,
          shininess: 80,
          specular: 0x222222,
          reflectivity: 0.1
        }),
        door: new THREE.MeshPhongMaterial({
          color: 0xf0f0f0,
          shininess: 120,
          specular: 0x444444,
          reflectivity: 0.2
        }),
        handle: new THREE.MeshPhongMaterial({
          color: 0xffd700,
          shininess: 300,
          specular: 0x888888,
          reflectivity: 0.3
        }),
        interior: new THREE.MeshLambertMaterial({
          color: 0xffffff,
          reflectivity: 0.1
        }),
        seal: new THREE.MeshLambertMaterial({ color: 0x333333 }),
        chrome: new THREE.MeshPhongMaterial({
          color: 0xc0c0c0,
          shininess: 400,
          specular: 0xffffff,
          reflectivity: 0.8
        })
      }

      // 冰箱主体 (40×30×36cm 按比例缩放)
      const bodyGeometry = new THREE.BoxGeometry(2, 3.6, 1.5)
      const body = new THREE.Mesh(bodyGeometry, materials.body)
      body.position.y = 1.8
      body.castShadow = true
      body.receiveShadow = true
      fridgeGroup.add(body)

      // 冰箱侧面装饰条
      const sideStripGeometry = new THREE.BoxGeometry(0.03, 3.6, 0.02)
      const sideStripMaterial = new THREE.MeshPhongMaterial({
        color: 0xe0e0e0,
        shininess: 150
      })

      const leftStrip = new THREE.Mesh(sideStripGeometry, sideStripMaterial)
      leftStrip.position.set(-1.015, 1.8, 0.76)
      fridgeGroup.add(leftStrip)

      const rightStrip = new THREE.Mesh(sideStripGeometry, sideStripMaterial)
      rightStrip.position.set(1.015, 1.8, 0.76)
      fridgeGroup.add(rightStrip)

      // 冰箱背面散热器
      const radiatorGeometry = new THREE.BoxGeometry(1.8, 3.2, 0.1)
      const radiatorMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
      const radiator = new THREE.Mesh(radiatorGeometry, radiatorMaterial)
      radiator.position.set(0, 1.8, -0.8)
      fridgeGroup.add(radiator)

      // 散热器格栅
      for (let i = 0; i < 12; i++) {
        const grillGeometry = new THREE.BoxGeometry(1.6, 0.02, 0.05)
        const grill = new THREE.Mesh(grillGeometry, radiatorMaterial)
        grill.position.set(0, 0.4 + i * 0.25, -0.75)
        fridgeGroup.add(grill)
      }

      // 创建内部空间 - 更贴合现实的内部尺寸
      const interiorGeometry = new THREE.BoxGeometry(1.85, 3.4, 1.35) // 比外壳稍小
      const interior = new THREE.Mesh(interiorGeometry, materials.interior)
      interior.position.set(0, 1.8, -0.1) // 稍微向内偏移
      fridgeGroup.add(interior)

      // 上门 (冷冻室) - 修复旋转轴问题
      const upperDoorGroup = new THREE.Group()
      const upperDoorGeometry = new THREE.BoxGeometry(1.95, 1.7, 0.08)
      upperDoor = new THREE.Mesh(upperDoorGeometry, materials.door)
      // 门的几何中心相对于旋转轴（组的原点）的偏移
      upperDoor.position.set(0.975, 0, 0) // 门向右偏移，使左边缘在组的原点
      upperDoor.castShadow = true
      upperDoorGroup.add(upperDoor)
      // 组的位置就是旋转轴的位置（门的左边缘）
      upperDoorGroup.position.set(-0.975, 2.65, 0.79)
      fridgeGroup.add(upperDoorGroup)

      // 下门 (冷藏室) - 修复旋转轴问题
      const lowerDoorGroup = new THREE.Group()
      const lowerDoorGeometry = new THREE.BoxGeometry(1.95, 1.8, 0.08)
      lowerDoor = new THREE.Mesh(lowerDoorGeometry, materials.door)
      // 门的几何中心相对于旋转轴（组的原点）的偏移
      lowerDoor.position.set(0.975, 0, 0) // 门向右偏移，使左边缘在组的原点
      lowerDoor.castShadow = true
      lowerDoorGroup.add(lowerDoor)
      // 组的位置就是旋转轴的位置（门的左边缘）
      lowerDoorGroup.position.set(-0.975, 0.9, 0.79)
      fridgeGroup.add(lowerDoorGroup)

      // 门缝密封条
      const sealGeometry = new THREE.BoxGeometry(2, 0.05, 0.02)
      const seal = new THREE.Mesh(sealGeometry, materials.seal)
      seal.position.set(0, 1.8, 0.76)
      fridgeGroup.add(seal)

      // 上门把手 - 添加到上门组，位置相对于门组原点
      const upperHandleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5)
      const upperHandle = new THREE.Mesh(upperHandleGeometry, materials.handle)
      upperHandle.rotation.z = Math.PI / 2
      upperHandle.position.set(1.7, 0.15, 0.06) // 相对于门组原点的位置
      upperHandle.castShadow = true
      upperDoorGroup.add(upperHandle)

      // 下门把手 - 添加到下门组，位置相对于门组原点
      const lowerHandle = new THREE.Mesh(upperHandleGeometry, materials.handle)
      lowerHandle.rotation.z = Math.PI / 2
      lowerHandle.position.set(1.7, 0.2, 0.06) // 相对于门组原点的位置
      lowerHandle.castShadow = true
      lowerDoorGroup.add(lowerHandle)

      // 将门组添加到冰箱组中，稍后设置引用
      fridgeGroup.upperDoorGroup = upperDoorGroup
      fridgeGroup.lowerDoorGroup = lowerDoorGroup

      // 冰箱顶部
      const topGeometry = new THREE.BoxGeometry(2.1, 0.1, 1.6)
      const top = new THREE.Mesh(topGeometry, materials.body)
      top.position.set(0, 3.65, 0)
      top.castShadow = true
      fridgeGroup.add(top)

      // 冰箱底部支撑
      const baseGeometry = new THREE.BoxGeometry(2.1, 0.2, 1.6)
      const base = new THREE.Mesh(baseGeometry, materials.body)
      base.position.set(0, 0.1, 0)
      base.receiveShadow = true
      fridgeGroup.add(base)

      // 冰箱脚
      const footGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.1)
      const footMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })

      const positions = [
        [-0.8, 0.05, -0.6],
        [0.8, 0.05, -0.6],
        [-0.8, 0.05, 0.6],
        [0.8, 0.05, 0.6]
      ]

      positions.forEach(pos => {
        const foot = new THREE.Mesh(footGeometry, footMaterial)
        foot.position.set(...pos)
        foot.castShadow = true
        fridgeGroup.add(foot)
      })

      // 添加精美的装饰细节
      // 品牌标识区域（更立体）
      const logoGeometry = new THREE.BoxGeometry(0.4, 0.12, 0.02)
      const logoMaterial = new THREE.MeshPhongMaterial({
        color: 0x2c3e50,
        shininess: 100
      })
      const logo = new THREE.Mesh(logoGeometry, logoMaterial)
      logo.position.set(0, 3.2, 0.84)
      fridgeGroup.add(logo)

      // 品牌文字（简化的LOGO效果）
      const textGeometry = new THREE.PlaneGeometry(0.3, 0.06)
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      })
      const text = new THREE.Mesh(textGeometry, textMaterial)
      text.position.set(0, 3.2, 0.85)
      fridgeGroup.add(text)

      // 现代化温度显示面板
      const panelGeometry = new THREE.BoxGeometry(0.25, 0.18, 0.02)
      const panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        emissive: 0x002200,
        emissiveIntensity: 0.2,
        shininess: 200
      })
      const panel = new THREE.Mesh(panelGeometry, panelMaterial)
      panel.position.set(-0.6, 2.8, 0.84)
      fridgeGroup.add(panel)

      // 数字显示
      const displayGeometry = new THREE.PlaneGeometry(0.15, 0.08)
      const displayMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x004400
      })
      const display = new THREE.Mesh(displayGeometry, displayMaterial)
      display.position.set(-0.6, 2.8, 0.85)
      fridgeGroup.add(display)

      // 控制按钮
      const buttonGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01)
      const buttonMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a4a4a,
        shininess: 100
      })

      const buttonPositions = [
        [-0.7, 2.65, 0.84],
        [-0.6, 2.65, 0.84],
        [-0.5, 2.65, 0.84]
      ]

      buttonPositions.forEach(pos => {
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial)
        button.position.set(...pos)
        button.rotation.x = Math.PI / 2
        fridgeGroup.add(button)
      })

      // 改进的通风格栅（更立体）
      const grillFrameGeometry = new THREE.BoxGeometry(1.9, 0.4, 0.05)
      const grillFrameMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        shininess: 50
      })
      const grillFrame = new THREE.Mesh(grillFrameGeometry, grillFrameMaterial)
      grillFrame.position.set(0, -0.5, 0.78)
      fridgeGroup.add(grillFrame)

      // 格栅条
      for (let i = 0; i < 8; i++) {
        const grillBarGeometry = new THREE.BoxGeometry(1.7, 0.02, 0.02)
        const grillBarMaterial = new THREE.MeshPhongMaterial({
          color: 0x333333,
          shininess: 80
        })
        const grillBar = new THREE.Mesh(grillBarGeometry, grillBarMaterial)
        grillBar.position.set(0, -0.65 + i * 0.04, 0.79)
        fridgeGroup.add(grillBar)
      }

      // 门边装饰条 - 修正位置相对于门组原点
      const trimGeometry = new THREE.BoxGeometry(0.02, 1.7, 0.02)
      const trimMaterial = new THREE.MeshPhongMaterial({
        color: 0xc0c0c0,
        shininess: 200
      })

      // 上门装饰条
      const upperTrimLeft = new THREE.Mesh(trimGeometry, trimMaterial)
      upperTrimLeft.position.set(0, 0, 0.04) // 左边缘装饰条在组原点
      upperDoorGroup.add(upperTrimLeft)

      const upperTrimRight = new THREE.Mesh(trimGeometry, trimMaterial)
      upperTrimRight.position.set(1.95, 0, 0.04) // 右边缘装饰条
      upperDoorGroup.add(upperTrimRight)

      // 下门装饰条
      const lowerTrimGeometry = new THREE.BoxGeometry(0.02, 1.8, 0.02)
      const lowerTrimLeft = new THREE.Mesh(lowerTrimGeometry, trimMaterial)
      lowerTrimLeft.position.set(0, 0, 0.04) // 左边缘装饰条在组原点
      lowerDoorGroup.add(lowerTrimLeft)

      const lowerTrimRight = new THREE.Mesh(lowerTrimGeometry, trimMaterial)
      lowerTrimRight.position.set(1.95, 0, 0.04) // 右边缘装饰条
      lowerDoorGroup.add(lowerTrimRight)

      // 门把手装饰环 - 修正位置
      const handleRingGeometry = new THREE.TorusGeometry(0.05, 0.01, 8, 16)
      const handleRingMaterial = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 300
      })

      const upperHandleRing = new THREE.Mesh(handleRingGeometry, handleRingMaterial)
      upperHandleRing.rotation.z = Math.PI / 2
      upperHandleRing.position.set(1.7, 0.15, 0.08)
      upperDoorGroup.add(upperHandleRing)

      const lowerHandleRing = new THREE.Mesh(handleRingGeometry, handleRingMaterial)
      lowerHandleRing.rotation.z = Math.PI / 2
      lowerHandleRing.position.set(1.7, 0.2, 0.08)
      lowerDoorGroup.add(lowerHandleRing)

      // 门磁条 - 修正位置
      const magnetStripGeometry = new THREE.BoxGeometry(1.95, 0.02, 0.01)
      const magnetStripMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 })

      const upperMagnetStrip = new THREE.Mesh(magnetStripGeometry, magnetStripMaterial)
      upperMagnetStrip.position.set(0.975, -0.84, 0.04)
      upperDoorGroup.add(upperMagnetStrip)

      const lowerMagnetStrip = new THREE.Mesh(magnetStripGeometry, magnetStripMaterial)
      lowerMagnetStrip.position.set(0.975, 0.89, 0.04)
      lowerDoorGroup.add(lowerMagnetStrip)

      // 门锁指示灯 - 修正位置
      const lockIndicatorGeometry = new THREE.SphereGeometry(0.015)
      const lockIndicatorMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x002200
      })
      const lockIndicator = new THREE.Mesh(lockIndicatorGeometry, lockIndicatorMaterial)
      lockIndicator.position.set(1.4, -0.3, 0.04)
      upperDoorGroup.add(lockIndicator)

      // 门铰链 - 修正位置，铰链应该在门组的原点（旋转轴）
      const hingeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15)
      const hingeMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        shininess: 100
      })

      // 上门铰链 - 在旋转轴位置
      for (let i = 0; i < 3; i++) {
        const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial)
        hinge.position.set(0, -0.6 + i * 0.6, 0.04) // 在组原点（旋转轴）
        upperDoorGroup.add(hinge)
      }

      // 下门铰链 - 在旋转轴位置
      for (let i = 0; i < 3; i++) {
        const hinge = new THREE.Mesh(hingeGeometry, hingeMaterial)
        hinge.position.set(0, -0.7 + i * 0.7, 0.04) // 在组原点（旋转轴）
        lowerDoorGroup.add(hinge)
      }

      // 能效标签 - 修正位置
      const energyLabelGeometry = new THREE.PlaneGeometry(0.15, 0.2)
      const energyLabelMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.8
      })
      const energyLabel = new THREE.Mesh(energyLabelGeometry, energyLabelMaterial)
      energyLabel.position.set(0.5, -0.5, 0.04)
      lowerDoorGroup.add(energyLabel)

      // 添加冰箱内部细节
      createFridgeInterior(fridgeGroup, upperDoorGroup, lowerDoorGroup)

      scene.add(fridgeGroup)
      fridgeModel = fridgeGroup

      // 创建动态食物组
      dynamicFoodGroup = new THREE.Group()
      scene.add(dynamicFoodGroup)

      loading.value = false

      // 模型加载完成后加载和渲染食物
      loadFoodData().then(() => {
        if (foodData.value.length > 0) {
          renderDynamicFoods()
        }
      })
    }

    // 创建厨房装饰
    const createKitchenDecoration = () => {
      // 创建专业冰柜
      createChestFreezer()

      // 添加厨房台面
      const counterGeometry = new THREE.BoxGeometry(4, 0.1, 2)
      const counterMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 60
      })
      const counter = new THREE.Mesh(counterGeometry, counterMaterial)
      counter.position.set(-6, 0.9, -2)
      counter.castShadow = true
      counter.receiveShadow = true
      scene.add(counter)

      // 添加橱柜
      const cabinetGeometry = new THREE.BoxGeometry(4, 1.6, 1.8)
      const cabinetMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 })
      const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
      cabinet.position.set(-6, 0.1, -2)
      cabinet.castShadow = true
      scene.add(cabinet)

      // 添加一些厨房用品
      const potGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.2)
      const potMaterial = new THREE.MeshPhongMaterial({
        color: 0x2F4F4F,
        shininess: 100
      })
      const pot = new THREE.Mesh(potGeometry, potMaterial)
      pot.position.set(-7, 1.05, -2)
      pot.castShadow = true
      scene.add(pot)

      // 添加微波炉
      const microwaveGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4)
      const microwaveMaterial = new THREE.MeshPhongMaterial({
        color: 0x2c3e50,
        shininess: 80
      })
      const microwave = new THREE.Mesh(microwaveGeometry, microwaveMaterial)
      microwave.position.set(-5.5, 1.15, -2)
      microwave.castShadow = true
      scene.add(microwave)

      // 微波炉门
      const microwaveDoorGeometry = new THREE.PlaneGeometry(0.5, 0.3)
      const microwaveDoorMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        transparent: true,
        opacity: 0.8
      })
      const microwaveDoor = new THREE.Mesh(microwaveDoorGeometry, microwaveDoorMaterial)
      microwaveDoor.position.set(-5.2, 1.15, -1.8)
      scene.add(microwaveDoor)
    }

    // 创建专业冰柜
    const createChestFreezer = () => {
      const freezerGroup = new THREE.Group()

      // 冰柜材质
      const freezerMaterials = {
        body: new THREE.MeshPhongMaterial({
          color: 0xf5f5f5,
          shininess: 100,
          specular: 0x333333
        }),
        lid: new THREE.MeshPhongMaterial({
          color: 0xf0f0f0,
          shininess: 120,
          specular: 0x444444
        }),
        handle: new THREE.MeshPhongMaterial({
          color: 0x2c3e50,
          shininess: 200
        }),
        interior: new THREE.MeshLambertMaterial({ color: 0xffffff }),
        insulation: new THREE.MeshLambertMaterial({ color: 0xe8e8e8 })
      }

      // 冰柜主体
      const freezerBodyGeometry = new THREE.BoxGeometry(3, 1.2, 1.8)
      const freezerBody = new THREE.Mesh(freezerBodyGeometry, freezerMaterials.body)
      freezerBody.position.set(0, 0.6, 0)
      freezerBody.castShadow = true
      freezerBody.receiveShadow = true
      freezerGroup.add(freezerBody)

      // 冰柜盖子（可开启）
      const freezerLidGroup = new THREE.Group()
      const freezerLidGeometry = new THREE.BoxGeometry(3.1, 0.15, 1.9)
      const freezerLid = new THREE.Mesh(freezerLidGeometry, freezerMaterials.lid)
      freezerLid.position.set(0, 0, 0)
      freezerLid.castShadow = true
      freezerLidGroup.add(freezerLid)

      // 盖子把手
      const lidHandleGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.15)
      const lidHandle = new THREE.Mesh(lidHandleGeometry, freezerMaterials.handle)
      lidHandle.position.set(0, 0.12, 0.8)
      freezerLidGroup.add(lidHandle)

      // 盖子密封条
      const sealGeometry = new THREE.BoxGeometry(3.0, 0.03, 1.8)
      const seal = new THREE.Mesh(sealGeometry, new THREE.MeshLambertMaterial({ color: 0x333333 }))
      seal.position.set(0, -0.06, 0)
      freezerLidGroup.add(seal)

      freezerLidGroup.position.set(0, 1.275, 0)
      freezerGroup.add(freezerLidGroup)

      // 冰柜内部 - 更贴合现实的内部尺寸
      const freezerInteriorGeometry = new THREE.BoxGeometry(2.85, 1.05, 1.65) // 比外壳稍小
      const freezerInterior = new THREE.Mesh(freezerInteriorGeometry, freezerMaterials.interior)
      freezerInterior.position.set(0, 0.525, -0.025) // 稍微向内和向后偏移
      freezerGroup.add(freezerInterior)

      // 增强内部分隔篮 - 更真实的层次感
      const basketGeometry = new THREE.BoxGeometry(1.25, 0.25, 0.75)
      const basketMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
        shininess: 80
      })

      // 篮子边框
      const basketFrameGeometry = new THREE.BoxGeometry(1.3, 0.03, 0.8)
      const basketFrameMaterial = new THREE.MeshPhongMaterial({
        color: 0xe0e0e0,
        shininess: 100
      })

      // 第一层篮子
      const basket1 = new THREE.Mesh(basketGeometry, basketMaterial)
      basket1.position.set(-0.7, 0.75, 0.4)
      freezerGroup.add(basket1)

      const basket1Frame = new THREE.Mesh(basketFrameGeometry, basketFrameMaterial)
      basket1Frame.position.set(-0.7, 0.88, 0.4)
      freezerGroup.add(basket1Frame)

      // 第二层篮子
      const basket2 = new THREE.Mesh(basketGeometry, basketMaterial)
      basket2.position.set(0.7, 0.75, 0.4)
      freezerGroup.add(basket2)

      const basket2Frame = new THREE.Mesh(basketFrameGeometry, basketFrameMaterial)
      basket2Frame.position.set(0.7, 0.88, 0.4)
      freezerGroup.add(basket2Frame)

      // 第三层篮子（底层）
      const basket3 = new THREE.Mesh(basketGeometry, basketMaterial)
      basket3.position.set(0, 0.4, -0.4)
      freezerGroup.add(basket3)

      const basket3Frame = new THREE.Mesh(basketFrameGeometry, basketFrameMaterial)
      basket3Frame.position.set(0, 0.53, -0.4)
      freezerGroup.add(basket3Frame)

      // 添加篮子把手
      const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15)
      const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 })

      for (let i = 0; i < 3; i++) {
        const handle = new THREE.Mesh(handleGeometry, handleMaterial)
        handle.rotation.z = Math.PI / 2
        if (i === 0) handle.position.set(-0.05, 0.88, 0.4)
        else if (i === 1) handle.position.set(1.35, 0.88, 0.4)
        else handle.position.set(0.65, 0.53, -0.4)
        freezerGroup.add(handle)
      }

      // 增强冷冻食品 - 分层摆放，更真实
      // 第一层篮子 - 冰淇淋和甜品
      const iceCreamTubGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.18)
      const iceCreamMaterials = [
        new THREE.MeshPhongMaterial({ color: 0xFFB6C1 }), // 草莓
        new THREE.MeshPhongMaterial({ color: 0xF0E68C }), // 香草
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })  // 巧克力
      ]

      for (let i = 0; i < 3; i++) {
        const iceCreamTub = new THREE.Mesh(iceCreamTubGeometry, iceCreamMaterials[i])
        iceCreamTub.position.set(-0.9 + i * 0.3, 0.87, 0.4)
        freezerGroup.add(iceCreamTub)

        // 添加标签
        const labelGeometry = new THREE.PlaneGeometry(0.2, 0.1)
        const labelMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
        const label = new THREE.Mesh(labelGeometry, labelMaterial)
        label.position.set(-0.9 + i * 0.3, 0.95, 0.52)
        freezerGroup.add(label)
      }

      // 第二层篮子 - 冷冻蔬菜和半成品
      const frozenVegGeometry = new THREE.BoxGeometry(0.22, 0.12, 0.04)
      const frozenVegMaterials = [
        new THREE.MeshLambertMaterial({ color: 0x90EE90 }), // 豌豆
        new THREE.MeshLambertMaterial({ color: 0xFF8C00 }), // 胡萝卜
        new THREE.MeshLambertMaterial({ color: 0xFFD700 }), // 玉米
        new THREE.MeshLambertMaterial({ color: 0x228B22 })  // 菠菜
      ]

      for (let i = 0; i < 4; i++) {
        const frozenVeg = new THREE.Mesh(frozenVegGeometry, frozenVegMaterials[i])
        frozenVeg.position.set(0.4 + i * 0.15, 0.87, 0.4)
        frozenVeg.rotation.y = Math.random() * 0.3 - 0.15 // 随机小角度旋转
        freezerGroup.add(frozenVeg)
      }

      // 冷冻饺子盒
      const dumplingBoxGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.18)
      const dumplingBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
      const dumplingBox = new THREE.Mesh(dumplingBoxGeometry, dumplingBoxMaterial)
      dumplingBox.position.set(0.5, 0.87, 0.1)
      freezerGroup.add(dumplingBox)

      // 第三层篮子（底层）- 肉类和大件食品
      const meatGeometry = new THREE.BoxGeometry(0.28, 0.15, 0.08)
      const meatMaterials = [
        new THREE.MeshLambertMaterial({ color: 0xDC143C }), // 牛肉
        new THREE.MeshLambertMaterial({ color: 0xFF69B4 }), // 猪肉
        new THREE.MeshLambertMaterial({ color: 0xF0E68C })  // 鸡肉
      ]

      for (let i = 0; i < 3; i++) {
        const meat = new THREE.Mesh(meatGeometry, meatMaterials[i])
        meat.position.set(-0.3 + i * 0.3, 0.52, -0.4)
        meat.rotation.y = Math.random() * 0.2 - 0.1
        freezerGroup.add(meat)
      }

      // 冷冻鱼类
      const fishGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.25)
      const fishMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 })
      const fish = new THREE.Mesh(fishGeometry, fishMaterial)
      fish.rotation.z = Math.PI / 2
      fish.position.set(0.3, 0.52, -0.2)
      freezerGroup.add(fish)

      // 添加一些散落的冰块效果
      const iceGeometry = new THREE.SphereGeometry(0.02)
      const iceMaterial = new THREE.MeshPhongMaterial({
        color: 0xE0FFFF,
        transparent: true,
        opacity: 0.8,
        shininess: 200
      })

      for (let i = 0; i < 15; i++) {
        const ice = new THREE.Mesh(iceGeometry, iceMaterial)
        ice.position.set(
          -1.2 + Math.random() * 2.4,
          0.65 + Math.random() * 0.4,
          -0.6 + Math.random() * 1.2
        )
        freezerGroup.add(ice)
      }

      // 冰柜底部支撑脚
      const footGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.08)
      const footMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 })
      const footPositions = [
        [-1.3, 0.04, -0.7],
        [1.3, 0.04, -0.7],
        [-1.3, 0.04, 0.7],
        [1.3, 0.04, 0.7]
      ]

      footPositions.forEach(pos => {
        const foot = new THREE.Mesh(footGeometry, footMaterial)
        foot.position.set(...pos)
        freezerGroup.add(foot)
      })

      // 品牌标识
      const freezerLogoGeometry = new THREE.PlaneGeometry(0.4, 0.1)
      const freezerLogoMaterial = new THREE.MeshLambertMaterial({
        color: 0x2c3e50,
        transparent: true,
        opacity: 0.8
      })
      const freezerLogo = new THREE.Mesh(freezerLogoGeometry, freezerLogoMaterial)
      freezerLogo.position.set(0, 1.0, 0.91)
      freezerGroup.add(freezerLogo)

      // 温度控制旋钮
      const knobGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.03)
      const knobMaterial = new THREE.MeshPhongMaterial({
        color: 0x666666,
        shininess: 100
      })
      const knob = new THREE.Mesh(knobGeometry, knobMaterial)
      knob.position.set(1.2, 1.0, 0.91)
      knob.rotation.x = Math.PI / 2
      freezerGroup.add(knob)

      // 电源指示灯
      const indicatorGeometry = new THREE.SphereGeometry(0.02)
      const indicatorMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x004400
      })
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      indicator.position.set(1.0, 1.0, 0.91)
      freezerGroup.add(indicator)

      // 保存盖子引用以便交互
      freezerGroup.lidGroup = freezerLidGroup
      freezerGroup.position.set(-3, 0, 1)
      scene.add(freezerGroup)

      // 保存冰柜引用
      freezerModel = freezerGroup

      // 如果动态食物组还未创建，创建它
      if (!dynamicFoodGroup) {
        dynamicFoodGroup = new THREE.Group()
        scene.add(dynamicFoodGroup)
      }

      // 如果有食物数据，渲染食物
      if (foodData.value.length > 0) {
        renderDynamicFoods()
      }
    }

    // 创建真实层次感的冰箱内部
    const createFridgeInterior = (fridgeGroup, upperDoorGroup, lowerDoorGroup) => {
      // 美化内部材质定义 - 增强空间感和视觉效果
      const interiorMaterials = {
        // 钢化玻璃隔板 - 更透明更有层次
        glassShelf: new THREE.MeshPhongMaterial({
          color: 0xf0f8ff, // 淡蓝色调
          transparent: true,
          opacity: 0.6, // 更透明
          shininess: 400,
          reflectivity: 0.7, // 强反射
          specular: 0xffffff
        }),
        // 冷冻室内壁 - 明显的冷色调，与外壳形成对比
        freezerWall: new THREE.MeshPhongMaterial({
          color: 0xd6ebff, // 更明显的冰蓝色
          shininess: 80,
          specular: 0x4a90e2
        }),
        // 冷藏室内壁 - 明显的暖色调，与外壳形成对比
        fridgeWall: new THREE.MeshPhongMaterial({
          color: 0xfff0e6, // 更明显的温暖米色
          shininess: 70,
          specular: 0xffd700
        }),
        // LED灯条 - 更亮更温暖
        ledLight: new THREE.MeshLambertMaterial({
          color: 0xffffff,
          emissive: 0xfff8dc // 温暖白光
        }),
        // 塑料组件 - 现代感
        plastic: new THREE.MeshPhongMaterial({
          color: 0xf5f5f5,
          shininess: 100,
          specular: 0x888888
        }),
        // 金属支架 - 高级感
        metalFrame: new THREE.MeshPhongMaterial({
          color: 0xc8d6e5, // 银蓝色
          shininess: 200,
          specular: 0xffffff,
          reflectivity: 0.4
        }),
        // 橡胶密封条
        rubber: new THREE.MeshLambertMaterial({
          color: 0x2c3e50
        }),
        // 深度指示材质
        depthIndicator: new THREE.MeshLambertMaterial({
          color: 0xddeeff,
          transparent: true,
          opacity: 0.3
        })
      }

      // === 冷冻室内部（上层）- 真实层次感设计 ===
      const freezerInterior = new THREE.Group()

      // 冷冻室内壁系统 - 6面体完整包围，尺寸贴合内部空间
      // 后壁 - 分层设计增加深度感
      const freezerBackWall = new THREE.PlaneGeometry(1.75, 1.55) // 适配内部尺寸
      const backWall = new THREE.Mesh(freezerBackWall, interiorMaterials.freezerWall)
      backWall.position.set(0, 0, -0.65) // 贴合内部后壁
      freezerInterior.add(backWall)

      // 后壁深度层次装饰
      const backPanelGeometry = new THREE.PlaneGeometry(1.55, 1.35)
      const backPanel = new THREE.Mesh(backPanelGeometry, new THREE.MeshPhongMaterial({
        color: 0xc8e6ff, // 更明显的层次色彩
        shininess: 60,
        transparent: true,
        opacity: 0.8
      }))
      backPanel.position.set(0, 0, -0.64)
      freezerInterior.add(backPanel)

      // 深度指示网格
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 5; j++) {
          const gridGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.005)
          const gridMesh = new THREE.Mesh(gridGeometry, interiorMaterials.depthIndicator)
          gridMesh.position.set(-0.6 + i * 0.2, -0.6 + j * 0.3, -0.695)
          freezerInterior.add(gridMesh)
        }
      }

      // 左壁 - 冷色调设计，贴合内部尺寸
      const freezerLeftWall = new THREE.PlaneGeometry(1.3, 1.55)
      const leftWall = new THREE.Mesh(freezerLeftWall, interiorMaterials.freezerWall)
      leftWall.rotation.y = Math.PI / 2
      leftWall.position.set(-0.875, 0, -0.325) // 贴合内部左壁
      freezerInterior.add(leftWall)

      // 右壁 - 冷色调设计
      const rightWall = new THREE.Mesh(freezerLeftWall, interiorMaterials.freezerWall)
      rightWall.rotation.y = -Math.PI / 2
      rightWall.position.set(0.875, 0, -0.325) // 贴合内部右壁
      freezerInterior.add(rightWall)

      // 顶壁 - 冷色调设计
      const freezerTopWall = new THREE.PlaneGeometry(1.75, 1.3)
      const topWall = new THREE.Mesh(freezerTopWall, interiorMaterials.freezerWall)
      topWall.rotation.x = Math.PI / 2
      topWall.position.set(0, 0.775, -0.325) // 贴合内部顶壁
      freezerInterior.add(topWall)

      // 底壁 - 冷色调设计
      const bottomWall = new THREE.Mesh(freezerTopWall, interiorMaterials.freezerWall)
      bottomWall.rotation.x = -Math.PI / 2
      bottomWall.position.set(0, -0.775, -0.325) // 贴合内部底壁
      freezerInterior.add(bottomWall)

      // 侧壁深度装饰条
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < 6; i++) {
          const sideStripeGeometry = new THREE.BoxGeometry(0.005, 0.2, 1.2)
          const sideStripeMaterial = new THREE.MeshLambertMaterial({
            color: 0xc8e6ff,
            transparent: true,
            opacity: 0.5
          })
          const sideStripe = new THREE.Mesh(sideStripeGeometry, sideStripeMaterial)
          sideStripe.position.set(side === 0 ? -0.895 : 0.895, -0.7 + i * 0.25, -0.35)
          freezerInterior.add(sideStripe)
        }
      }

      // 冷冻室多层隔板系统 - 贴合内部空间尺寸
      // 主隔板（钢化玻璃）- 适配内部宽度和深度
      const mainShelfGeometry = new THREE.BoxGeometry(1.7, 0.008, 1.25) // 贴合内部尺寸

      // 上层隔板 - 分段设计增加层次
      const mainShelf1 = new THREE.Mesh(mainShelfGeometry, interiorMaterials.glassShelf)
      mainShelf1.position.set(0, 0.25, -0.325) // 贴合内部深度
      freezerInterior.add(mainShelf1)

      // 上层隔板装饰边缘
      const shelf1EdgeGeometry = new THREE.BoxGeometry(1.72, 0.02, 0.02)
      const shelf1Edge = new THREE.Mesh(shelf1EdgeGeometry, interiorMaterials.metalFrame)
      shelf1Edge.position.set(0, 0.26, 0.3) // 贴合内部前缘
      freezerInterior.add(shelf1Edge)

      // 下层隔板 - 不同深度
      const mainShelf2 = new THREE.Mesh(mainShelfGeometry, interiorMaterials.glassShelf)
      mainShelf2.position.set(0, -0.35, -0.3) // 贴合内部深度
      freezerInterior.add(mainShelf2)

      // 下层隔板装饰边缘
      const shelf2EdgeGeometry = new THREE.BoxGeometry(1.72, 0.02, 0.02)
      const shelf2Edge = new THREE.Mesh(shelf2EdgeGeometry, interiorMaterials.metalFrame)
      shelf2Edge.position.set(0, -0.34, 0.32) // 贴合内部前缘
      freezerInterior.add(shelf2Edge)

      // 隔板间空间分隔线 - 增强层次感
      for (let i = 0; i < 3; i++) {
        const spacerGeometry = new THREE.BoxGeometry(1.6, 0.005, 1.3)
        const spacerMaterial = new THREE.MeshLambertMaterial({
          color: 0xb3d9ff,
          transparent: true,
          opacity: 0.2
        })
        const spacer = new THREE.Mesh(spacerGeometry, spacerMaterial)
        spacer.position.set(0, 0.1 - i * 0.3, -0.29)
        freezerInterior.add(spacer)
      }

      // 隔板支撑框架（金属）
      const shelfFrameGeometry = new THREE.BoxGeometry(1.78, 0.02, 0.02)
      for (let i = 0; i < 2; i++) {
        const yPos = i === 0 ? 0.25 : -0.35

        // 前支撑
        const frontFrame = new THREE.Mesh(shelfFrameGeometry, interiorMaterials.metalFrame)
        frontFrame.position.set(0, yPos, 0.47)
        freezerInterior.add(frontFrame)

        // 后支撑
        const backFrame = new THREE.Mesh(shelfFrameGeometry, interiorMaterials.metalFrame)
        backFrame.position.set(0, yPos, -0.77)
        freezerInterior.add(backFrame)

        // 左右支撑
        const sideFrameGeometry = new THREE.BoxGeometry(0.02, 0.02, 1.25)
        const leftFrame = new THREE.Mesh(sideFrameGeometry, interiorMaterials.metalFrame)
        leftFrame.position.set(-0.88, yPos, -0.15)
        freezerInterior.add(leftFrame)

        const rightFrame = new THREE.Mesh(sideFrameGeometry, interiorMaterials.metalFrame)
        rightFrame.position.set(0.88, yPos, -0.15)
        freezerInterior.add(rightFrame)
      }

      // 冷冻室专业照明系统
      // 主LED灯条
      const ledStripGeometry = new THREE.BoxGeometry(1.4, 0.02, 0.06)
      const mainLedStrip = new THREE.Mesh(ledStripGeometry, interiorMaterials.ledLight)
      mainLedStrip.position.set(0, 0.75, -0.62)
      freezerInterior.add(mainLedStrip)

      // 侧面补光LED
      const sideLedGeometry = new THREE.BoxGeometry(0.02, 1.2, 0.04)
      const leftLed = new THREE.Mesh(sideLedGeometry, interiorMaterials.ledLight)
      leftLed.position.set(-0.85, 0, -0.62)
      freezerInterior.add(leftLed)

      const rightLed = new THREE.Mesh(sideLedGeometry, interiorMaterials.ledLight)
      rightLed.position.set(0.85, 0, -0.62)
      freezerInterior.add(rightLed)

      // 温度传感器（真实位置）
      const tempSensorGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.04)
      const tempSensorMaterial = new THREE.MeshPhongMaterial({ color: 0x2c3e50 })
      const tempSensor = new THREE.Mesh(tempSensorGeometry, tempSensorMaterial)
      tempSensor.position.set(0.7, 0.6, -0.65)
      tempSensor.rotation.x = Math.PI / 2
      freezerInterior.add(tempSensor)

      // 传感器连接线
      const wireGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.3)
      const wireMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
      const sensorWire = new THREE.Mesh(wireGeometry, wireMaterial)
      sensorWire.position.set(0.7, 0.45, -0.65)
      freezerInterior.add(sensorWire)

      // 隔板支撑条
      for (let i = 0; i < 4; i++) {
        const supportGeometry = new THREE.CylinderGeometry(0.01, 0.01, 1.6)
        const support = new THREE.Mesh(supportGeometry, interiorMaterials.metal)
        support.position.set(-0.7 + i * 0.47, 0, -0.6)
        freezerInterior.add(support)
      }

      // 冷冻室LED照明条
      const freezerLightGeometry = new THREE.BoxGeometry(1.5, 0.03, 0.08)
      const freezerLight = new THREE.Mesh(freezerLightGeometry, interiorMaterials.light)
      freezerLight.position.set(0, 0.75, -0.6)
      freezerInterior.add(freezerLight)

      // 温度传感器
      const freezerSensorGeometry = new THREE.SphereGeometry(0.02)
      const freezerSensorMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 })
      const freezerSensor = new THREE.Mesh(freezerSensorGeometry, freezerSensorMaterial)
      freezerSensor.position.set(0.7, 0.6, -0.6)
      freezerInterior.add(freezerSensor)

      // === 冷冻食品分层摆放系统 ===

      // 顶层隔板食品（精致小包装）
      // 高档冰淇淋盒
      const premiumIceCreamGeometry = new THREE.BoxGeometry(0.22, 0.1, 0.16)
      const iceCreamMaterials = [
        new THREE.MeshPhongMaterial({ color: 0xFFB6C1 }), // 草莓味
        new THREE.MeshPhongMaterial({ color: 0xF0E68C }), // 香草味
        new THREE.MeshPhongMaterial({ color: 0x8B4513 })  // 巧克力味
      ]

      for (let i = 0; i < 3; i++) {
        const iceCream = new THREE.Mesh(premiumIceCreamGeometry, iceCreamMaterials[i])
        iceCream.position.set(-0.6 + i * 0.3, 0.31, -0.4)
        iceCream.rotation.y = (Math.random() - 0.5) * 0.2 // 轻微随机旋转
        freezerInterior.add(iceCream)

        // 品牌标签
        const labelGeometry = new THREE.PlaneGeometry(0.18, 0.06)
        const labelMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
        const label = new THREE.Mesh(labelGeometry, labelMaterial)
        label.position.set(-0.6 + i * 0.3, 0.36, -0.32)
        freezerInterior.add(label)
      }

      // 冷冻水饺盒
      const dumplingBoxGeometry = new THREE.BoxGeometry(0.28, 0.08, 0.2)
      const dumplingBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC })
      const dumplingBox = new THREE.Mesh(dumplingBoxGeometry, dumplingBoxMaterial)
      dumplingBox.position.set(0.4, 0.31, -0.2)
      freezerInterior.add(dumplingBox)

      // 中层隔板食品（日常食材）
      // 冷冻蔬菜包装袋
      const frozenVegGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.04)
      const vegMaterials = [
        new THREE.MeshLambertMaterial({ color: 0x90EE90 }), // 豌豆
        new THREE.MeshLambertMaterial({ color: 0xFF8C00 }), // 胡萝卜丁
        new THREE.MeshLambertMaterial({ color: 0xFFD700 }), // 玉米粒
        new THREE.MeshLambertMaterial({ color: 0x228B22 })  // 菠菜
      ]

      for (let i = 0; i < 4; i++) {
        const vegPack = new THREE.Mesh(frozenVegGeometry, vegMaterials[i])
        vegPack.position.set(-0.5 + i * 0.25, -0.29, -0.5)
        vegPack.rotation.y = (Math.random() - 0.5) * 0.3
        freezerInterior.add(vegPack)
      }

      // 冷冻披萨（立放）
      const pizzaGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.025)
      const pizzaMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 })
      const pizza1 = new THREE.Mesh(pizzaGeometry, pizzaMaterial)
      pizza1.position.set(0.3, -0.29, -0.1)
      pizza1.rotation.x = Math.PI / 2
      freezerInterior.add(pizza1)

      const pizza2 = new THREE.Mesh(pizzaGeometry, pizzaMaterial)
      pizza2.position.set(0.5, -0.29, -0.1)
      pizza2.rotation.x = Math.PI / 2
      freezerInterior.add(pizza2)

      // 速冻汤圆盒
      const tangyuanBoxGeometry = new THREE.BoxGeometry(0.18, 0.12, 0.18)
      const tangyuanBoxMaterial = new THREE.MeshLambertMaterial({ color: 0xFFE4E1 })
      const tangyuanBox = new THREE.Mesh(tangyuanBoxGeometry, tangyuanBoxMaterial)
      tangyuanBox.position.set(-0.2, -0.29, 0.2)
      freezerInterior.add(tangyuanBox)

      // 底层区域（大件和制冰）
      // 专业制冰盒（多个）
      const iceTrayGeometry = new THREE.BoxGeometry(0.25, 0.04, 0.18)
      const iceTrayMaterial = new THREE.MeshPhongMaterial({
        color: 0x87CEEB,
        transparent: true,
        opacity: 0.85,
        shininess: 100
      })

      // 制冰盒阵列
      for (let i = 0; i < 3; i++) {
        const iceTray = new THREE.Mesh(iceTrayGeometry, iceTrayMaterial)
        iceTray.position.set(-0.4 + i * 0.3, -0.72, 0.35)
        freezerInterior.add(iceTray)

        // 冰块细节
        for (let j = 0; j < 12; j++) {
          const iceGeometry = new THREE.BoxGeometry(0.018, 0.018, 0.018)
          const iceMaterial = new THREE.MeshPhongMaterial({
            color: 0xE0FFFF,
            transparent: true,
            opacity: 0.9,
            shininess: 200
          })
          const iceCube = new THREE.Mesh(iceGeometry, iceMaterial)
          iceCube.position.set(
            -0.5 + i * 0.3 + (j % 4) * 0.05,
            -0.7,
            0.28 + Math.floor(j / 4) * 0.05
          )
          freezerInterior.add(iceCube)
        }
      }

      // 大包装肉类（底层）
      const meatPackGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.08)
      const meatMaterials = [
        new THREE.MeshLambertMaterial({ color: 0xDC143C }), // 牛肉
        new THREE.MeshLambertMaterial({ color: 0xFF69B4 })  // 猪肉
      ]

      for (let i = 0; i < 2; i++) {
        const meatPack = new THREE.Mesh(meatPackGeometry, meatMaterials[i])
        meatPack.position.set(-0.3 + i * 0.6, -0.72, -0.3)
        meatPack.rotation.y = (Math.random() - 0.5) * 0.2
        freezerInterior.add(meatPack)
      }

      // 霜花效果（增加真实感）
      for (let i = 0; i < 20; i++) {
        const frostGeometry = new THREE.SphereGeometry(0.008 + Math.random() * 0.005)
        const frostMaterial = new THREE.MeshLambertMaterial({
          color: 0xF0F8FF,
          transparent: true,
          opacity: 0.6
        })
        const frost = new THREE.Mesh(frostGeometry, frostMaterial)
        frost.position.set(
          -0.8 + Math.random() * 1.6,
          -0.7 + Math.random() * 1.4,
          -0.6 + Math.random() * 1.2
        )
        freezerInterior.add(frost)
      }

      freezerInterior.position.set(0, 2.65, 0.35)
      fridgeGroup.add(freezerInterior)

      // === 冷藏室内部（下层）- 真实空间层次设计 ===
      const fridgeInterior = new THREE.Group()

      // 冷藏室完整内壁系统 - 贴合内部空间尺寸
      // 后壁（带出风口）- 温暖色调增强空间感
      const fridgeBackWall = new THREE.PlaneGeometry(1.75, 1.65) // 适配内部尺寸
      const fridgeBack = new THREE.Mesh(fridgeBackWall, interiorMaterials.fridgeWall)
      fridgeBack.position.set(0, 0, -0.625) // 贴合内部后壁
      fridgeInterior.add(fridgeBack)

      // 后壁装饰面板 - 分层设计
      const fridgeBackPanelGeometry = new THREE.PlaneGeometry(1.55, 1.45)
      const fridgeBackPanel = new THREE.Mesh(fridgeBackPanelGeometry, new THREE.MeshPhongMaterial({
        color: 0xffe4cc, // 更明显的温暖奶油色
        shininess: 80,
        transparent: true,
        opacity: 0.9
      }))
      fridgeBackPanel.position.set(0, 0, -0.615)
      fridgeInterior.add(fridgeBackPanel)

      // 后壁深度蜂窝网格（增强空间感）
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
          const hexGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.005, 6)
          const hexMaterial = new THREE.MeshLambertMaterial({
            color: 0xffe4b5,
            transparent: true,
            opacity: 0.3
          })
          const hex = new THREE.Mesh(hexGeometry, hexMaterial)
          hex.rotation.x = Math.PI / 2
          hex.position.set(-0.7 + i * 0.2, -0.75 + j * 0.25, -0.695)
          fridgeInterior.add(hex)
        }
      }

      // 出风口格栅
      for (let i = 0; i < 8; i++) {
        const ventGeometry = new THREE.PlaneGeometry(0.15, 0.02)
        const ventMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
        const vent = new THREE.Mesh(ventGeometry, ventMaterial)
        vent.position.set(-0.6 + i * 0.15, 0.6, -0.675)
        fridgeInterior.add(vent)
      }

      // 左右侧壁 - 温暖色调，贴合内部尺寸
      const fridgeSideWall = new THREE.PlaneGeometry(1.3, 1.65)
      const fridgeLeft = new THREE.Mesh(fridgeSideWall, interiorMaterials.fridgeWall)
      fridgeLeft.rotation.y = Math.PI / 2
      fridgeLeft.position.set(-0.875, 0, -0.3125) // 贴合内部左壁
      fridgeInterior.add(fridgeLeft)

      const fridgeRight = new THREE.Mesh(fridgeSideWall, interiorMaterials.fridgeWall)
      fridgeRight.rotation.y = -Math.PI / 2
      fridgeRight.position.set(0.875, 0, -0.3125) // 贴合内部右壁
      fridgeInterior.add(fridgeRight)

      // 顶壁和底壁 - 温暖色调
      const fridgeTopBottom = new THREE.PlaneGeometry(1.75, 1.3)
      const fridgeTop = new THREE.Mesh(fridgeTopBottom, interiorMaterials.fridgeWall)
      fridgeTop.rotation.x = Math.PI / 2
      fridgeTop.position.set(0, 0.825, -0.3125) // 贴合内部顶壁
      fridgeInterior.add(fridgeTop)

      const fridgeBottom = new THREE.Mesh(fridgeTopBottom, interiorMaterials.fridgeWall)
      fridgeBottom.rotation.x = -Math.PI / 2
      fridgeBottom.position.set(0, -0.825, -0.3125) // 贴合内部底壁
      fridgeInterior.add(fridgeBottom)

      // 侧壁装饰纹理 - 增强深度感
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < 8; i++) {
          const sideTextureGeometry = new THREE.BoxGeometry(0.003, 0.15, 1.25)
          const sideTextureMaterial = new THREE.MeshLambertMaterial({
            color: 0xffeaa7,
            transparent: true,
            opacity: 0.4
          })
          const sideTexture = new THREE.Mesh(sideTextureGeometry, sideTextureMaterial)
          sideTexture.position.set(side === 0 ? -0.895 : 0.895, -0.75 + i * 0.2, -0.35)
          fridgeInterior.add(sideTexture)
        }
      }

      // 冷藏室四层隔板系统（可调节高度）
      const shelfPositions = [0.55, 0.15, -0.25, -0.65] // 四层隔板高度
      const shelfDepths = [-0.3125, -0.3, -0.28, -0.26] // 不同深度形成层次

      for (let i = 0; i < 4; i++) {
        // 钢化玻璃隔板 - 贴合内部空间尺寸
        const glassShelfGeometry = new THREE.BoxGeometry(1.7, 0.008, 1.25) // 贴合内部尺寸
        const glassShelf = new THREE.Mesh(glassShelfGeometry, interiorMaterials.glassShelf)
        glassShelf.position.set(0, shelfPositions[i], shelfDepths[i])
        fridgeInterior.add(glassShelf)

        // 隔板装饰边缘 - 增强层次感，贴合内部尺寸
        const shelfEdgeGeometry = new THREE.BoxGeometry(1.72, 0.015, 0.02)
        const shelfEdge = new THREE.Mesh(shelfEdgeGeometry, interiorMaterials.metalFrame)
        shelfEdge.position.set(0, shelfPositions[i] + 0.01, 0.3125) // 贴合内部前缘
        fridgeInterior.add(shelfEdge)

        // 隔板下方阴影效果
        const shadowGeometry = new THREE.PlaneGeometry(1.7, 1.4)
        const shadowMaterial = new THREE.MeshLambertMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.05
        })
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.set(0, shelfPositions[i] - 0.02, -0.2)
        fridgeInterior.add(shadow)

        // 隔板金属边框 - 贴合内部尺寸
        const frameGeometry = new THREE.BoxGeometry(1.72, 0.015, 0.02)
        const frontFrame = new THREE.Mesh(frameGeometry, interiorMaterials.metalFrame)
        frontFrame.position.set(0, shelfPositions[i], 0.3125) // 贴合内部前缘
        fridgeInterior.add(frontFrame)

        const backFrame = new THREE.Mesh(frameGeometry, interiorMaterials.metalFrame)
        backFrame.position.set(0, shelfPositions[i], -0.625) // 贴合内部后缘
        fridgeInterior.add(backFrame)

        // 侧边支撑
        const sideFrameGeometry = new THREE.BoxGeometry(0.02, 0.015, 1.25)
        const leftSideFrame = new THREE.Mesh(sideFrameGeometry, interiorMaterials.metalFrame)
        leftSideFrame.position.set(-0.85, shelfPositions[i], -0.15625) // 贴合内部侧壁
        fridgeInterior.add(leftSideFrame)

        const rightSideFrame = new THREE.Mesh(sideFrameGeometry, interiorMaterials.metalFrame)
        rightSideFrame.position.set(0.85, shelfPositions[i], -0.15625) // 贴合内部侧壁
        fridgeInterior.add(rightSideFrame)

        // 隔板高度调节卡扣
        for (let j = 0; j < 4; j++) {
          const clipGeometry = new THREE.BoxGeometry(0.03, 0.02, 0.02)
          const clipMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 })
          const clip = new THREE.Mesh(clipGeometry, clipMaterial)
          const xPos = j < 2 ? -0.88 : 0.88
          const zPos = j % 2 === 0 ? -0.6 : 0.3
          clip.position.set(xPos, shelfPositions[i] + 0.02, zPos)
          fridgeInterior.add(clip)
        }
      }

      // 冷藏室专业照明系统
      // 主LED灯带（顶部）
      const mainLedGeometry = new THREE.BoxGeometry(1.6, 0.025, 0.08)
      const mainLed = new THREE.Mesh(mainLedGeometry, interiorMaterials.ledLight)
      mainLed.position.set(0, 0.8, -0.6)
      fridgeInterior.add(mainLed)

      // 侧面辅助照明
      const fridgeSideLedGeometry = new THREE.BoxGeometry(0.025, 1.4, 0.05)
      const leftSideLed = new THREE.Mesh(fridgeSideLedGeometry, interiorMaterials.ledLight)
      leftSideLed.position.set(-0.85, 0, -0.6)
      fridgeInterior.add(leftSideLed)

      const rightSideLed = new THREE.Mesh(fridgeSideLedGeometry, interiorMaterials.ledLight)
      rightSideLed.position.set(0.85, 0, -0.6)
      fridgeInterior.add(rightSideLed)

      // 温湿度传感器
      const humiditySensorGeometry = new THREE.BoxGeometry(0.04, 0.03, 0.02)
      const humiditySensorMaterial = new THREE.MeshPhongMaterial({ color: 0x34495e })
      const humiditySensor = new THREE.Mesh(humiditySensorGeometry, humiditySensorMaterial)
      humiditySensor.position.set(0.6, 0.7, -0.65)
      fridgeInterior.add(humiditySensor)

      // 传感器显示屏
      const displayGeometry = new THREE.PlaneGeometry(0.025, 0.015)
      const displayMaterial = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        emissive: 0x002200
      })
      const sensorDisplay = new THREE.Mesh(displayGeometry, displayMaterial)
      sensorDisplay.position.set(0.6, 0.7, -0.645)
      fridgeInterior.add(sensorDisplay)

      // 专业蔬菜保鲜抽屉系统（底部）
      // 抽屉外框
      const drawerFrameGeometry = new THREE.BoxGeometry(1.72, 0.28, 1.18)
      const drawerFrameMaterial = new THREE.MeshPhongMaterial({
        color: 0xf0f0f0,
        transparent: true,
        opacity: 0.9,
        shininess: 80
      })
      const drawerFrame = new THREE.Mesh(drawerFrameGeometry, drawerFrameMaterial)
      drawerFrame.position.set(0, -0.72, -0.12)
      fridgeInterior.add(drawerFrame)

      // 抽屉底部（透明）
      const drawerBottomGeometry = new THREE.BoxGeometry(1.7, 0.005, 1.16)
      const drawerBottom = new THREE.Mesh(drawerBottomGeometry, drawerFrameMaterial)
      drawerBottom.position.set(0, -0.86, -0.12)
      fridgeInterior.add(drawerBottom)

      // 抽屉把手（金属）
      const drawerHandleGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.04)
      const drawerHandle = new THREE.Mesh(drawerHandleGeometry, interiorMaterials.metalFrame)
      drawerHandle.position.set(0, -0.58, 0.47)
      fridgeInterior.add(drawerHandle)

      // 抽屉滑轨
      const railGeometry = new THREE.BoxGeometry(0.01, 0.01, 1.2)
      const railMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 })
      const leftRail = new THREE.Mesh(railGeometry, railMaterial)
      leftRail.position.set(-0.85, -0.72, -0.12)
      fridgeInterior.add(leftRail)

      const rightRail = new THREE.Mesh(railGeometry, railMaterial)
      rightRail.position.set(0.85, -0.72, -0.12)
      fridgeInterior.add(rightRail)

      // 湿度调节器
      const humidityControlGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.01)
      const humidityControl = new THREE.Mesh(humidityControlGeometry, interiorMaterials.metalFrame)
      humidityControl.position.set(0.7, -0.58, 0.4)
      humidityControl.rotation.x = Math.PI / 2
      fridgeInterior.add(humidityControl)

      // 冷藏室LED照明
      const fridgeLightGeometry = new THREE.BoxGeometry(1.6, 0.04, 0.1)
      const fridgeLight = new THREE.Mesh(fridgeLightGeometry, interiorMaterials.light)
      fridgeLight.position.set(0, 0.8, -0.6)
      fridgeInterior.add(fridgeLight)

      // 蔬菜保鲜抽屉（透明）
      const drawerGeometry = new THREE.BoxGeometry(1.7, 0.25, 1.15)
      const drawerMaterial = new THREE.MeshPhongMaterial({
        color: 0xf0f0f0,
        transparent: true,
        opacity: 0.6,
        shininess: 100
      })
      const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial)
      drawer.position.set(0, -0.68, -0.1)
      fridgeInterior.add(drawer)

      // 抽屉把手
      const vegDrawerHandleGeometry = new THREE.BoxGeometry(0.3, 0.03, 0.05)
      const vegDrawerHandle = new THREE.Mesh(vegDrawerHandleGeometry, interiorMaterials.plastic)
      vegDrawerHandle.position.set(0, -0.55, 0.48)
      fridgeInterior.add(vegDrawerHandle)

      // === 门内侧储物系统 ===
      // 上层门架
      const upperDoorShelfGeometry = new THREE.BoxGeometry(0.12, 0.35, 1.15)
      const upperDoorShelf = new THREE.Mesh(upperDoorShelfGeometry, interiorMaterials.shelf)
      upperDoorShelf.position.set(0.82, 0.4, -0.1)
      fridgeInterior.add(upperDoorShelf)

      // 中层门架
      const middleDoorShelf = new THREE.Mesh(upperDoorShelfGeometry, interiorMaterials.shelf)
      middleDoorShelf.position.set(0.82, 0, -0.1)
      fridgeInterior.add(middleDoorShelf)

      // 下层门架
      const lowerDoorShelf = new THREE.Mesh(upperDoorShelfGeometry, interiorMaterials.shelf)
      lowerDoorShelf.position.set(0.82, -0.4, -0.1)
      fridgeInterior.add(lowerDoorShelf)

      // 鸡蛋托盘
      const eggTrayGeometry = new THREE.BoxGeometry(0.1, 0.25, 0.15)
      const eggTrayMaterial = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 })
      const eggTray = new THREE.Mesh(eggTrayGeometry, eggTrayMaterial)
      eggTray.position.set(0.82, 0.1, 0.4)
      fridgeInterior.add(eggTray)

      // 鸡蛋
      const eggGeometry = new THREE.SphereGeometry(0.02, 8, 6)
      const eggMaterial = new THREE.MeshPhongMaterial({ color: 0xfff8dc })
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 2; j++) {
          const egg = new THREE.Mesh(eggGeometry, eggMaterial)
          egg.scale.y = 1.2
          egg.position.set(0.82, 0.05 + j * 0.1, 0.32 + i * 0.025)
          fridgeInterior.add(egg)
        }
      }

      // === 详细食物建模 ===
      // 牛奶盒（带标签）
      const milkGeometry = new THREE.BoxGeometry(0.1, 0.22, 0.07)
      const milkMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
      const milk = new THREE.Mesh(milkGeometry, milkMaterial)
      milk.position.set(0.77, 0.51, 0.2)
      fridgeInterior.add(milk)

      // 牛奶盒标签
      const labelGeometry = new THREE.PlaneGeometry(0.08, 0.15)
      const labelMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 })
      const label = new THREE.Mesh(labelGeometry, labelMaterial)
      label.position.set(0.825, 0.51, 0.2)
      fridgeInterior.add(label)

      // 果汁瓶
      const juiceGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.25)
      const juiceMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF8C00,
        transparent: true,
        opacity: 0.8,
        shininess: 100
      })
      const juice1 = new THREE.Mesh(juiceGeometry, juiceMaterial)
      juice1.position.set(0.77, 0.125, 0.3)
      fridgeInterior.add(juice1)

      const juice2 = new THREE.Mesh(juiceGeometry, juiceMaterial)
      juice2.position.set(0.77, 0.125, 0.1)
      fridgeInterior.add(juice2)

      // 酸奶杯
      const yogurtGeometry = new THREE.CylinderGeometry(0.04, 0.035, 0.08)
      const yogurtMaterial = new THREE.MeshLambertMaterial({ color: 0xFFB6C1 })
      for (let i = 0; i < 4; i++) {
        const yogurt = new THREE.Mesh(yogurtGeometry, yogurtMaterial)
        yogurt.position.set(-0.6 + i * 0.15, 0.54, 0.3)
        fridgeInterior.add(yogurt)
      }

      // 奶酪块
      const cheeseGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.15)
      const cheeseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 })
      const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial)
      cheese.position.set(-0.3, 0.54, -0.2)
      fridgeInterior.add(cheese)

      // 蔬菜详细建模
      // 西红柿
      const tomatoGeometry = new THREE.SphereGeometry(0.05)
      const tomatoMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 })
      for (let i = 0; i < 5; i++) {
        const tomato = new THREE.Mesh(tomatoGeometry, tomatoMaterial)
        tomato.position.set(-0.4 + i * 0.12, -0.6, 0.3)
        fridgeInterior.add(tomato)
      }

      // 胡萝卜
      const carrotGeometry = new THREE.CylinderGeometry(0.015, 0.025, 0.12)
      const carrotMaterial = new THREE.MeshPhongMaterial({ color: 0xFF8C00 })
      for (let i = 0; i < 4; i++) {
        const carrot = new THREE.Mesh(carrotGeometry, carrotMaterial)
        carrot.rotation.z = Math.PI / 2
        carrot.position.set(0.1 + i * 0.08, -0.6, -0.2)
        fridgeInterior.add(carrot)
      }

      // 生菜
      const lettuceGeometry = new THREE.SphereGeometry(0.08)
      const lettuceMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
      const lettuce = new THREE.Mesh(lettuceGeometry, lettuceMaterial)
      lettuce.scale.set(1, 0.6, 1)
      lettuce.position.set(-0.2, -0.6, 0)
      fridgeInterior.add(lettuce)

      // 黄瓜
      const cucumberGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2)
      const cucumberMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 })
      for (let i = 0; i < 2; i++) {
        const cucumber = new THREE.Mesh(cucumberGeometry, cucumberMaterial)
        cucumber.rotation.z = Math.PI / 2
        cucumber.position.set(0.3 + i * 0.1, -0.6, 0.1)
        fridgeInterior.add(cucumber)
      }

      // 调料瓶
      const condimentGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.15)
      const condimentMaterials = [
        new THREE.MeshPhongMaterial({ color: 0x8B0000 }), // 番茄酱
        new THREE.MeshPhongMaterial({ color: 0xFFD700 }), // 芥末
        new THREE.MeshPhongMaterial({ color: 0x006400 })  // 酱菜
      ]

      for (let i = 0; i < 3; i++) {
        const condiment = new THREE.Mesh(condimentGeometry, condimentMaterials[i])
        condiment.position.set(0.77, 0.075, -0.3 + i * 0.1)
        fridgeInterior.add(condiment)
      }

      // === 冷藏室食物分层摆放 ===

      // 顶层 - 饮品和调料
      // 牛奶盒
      const freshMilkGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.06)
      const freshMilkMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
      const milk1 = new THREE.Mesh(freshMilkGeometry, freshMilkMaterial)
      milk1.position.set(-0.6, 0.62, 0.3)
      fridgeInterior.add(milk1)

      const milk2 = new THREE.Mesh(freshMilkGeometry, freshMilkMaterial)
      milk2.position.set(-0.45, 0.62, 0.3)
      fridgeInterior.add(milk2)

      // 果汁瓶
      const freshJuiceGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.18)
      const freshJuiceMaterials = [
        new THREE.MeshPhongMaterial({ color: 0xFF8C00, transparent: true, opacity: 0.8 }),
        new THREE.MeshPhongMaterial({ color: 0xFF69B4, transparent: true, opacity: 0.8 }),
        new THREE.MeshPhongMaterial({ color: 0x32CD32, transparent: true, opacity: 0.8 })
      ]

      for (let i = 0; i < 3; i++) {
        const juice = new THREE.Mesh(freshJuiceGeometry, freshJuiceMaterials[i])
        juice.position.set(-0.2 + i * 0.1, 0.64, 0.35)
        fridgeInterior.add(juice)
      }

      // 第二层 - 熟食和剩菜
      // 保鲜盒
      const containerGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.12)
      const containerMaterial = new THREE.MeshPhongMaterial({
        color: 0xf0f0f0,
        transparent: true,
        opacity: 0.7
      })

      for (let i = 0; i < 4; i++) {
        const container = new THREE.Mesh(containerGeometry, containerMaterial)
        container.position.set(-0.5 + i * 0.25, 0.22, -0.2)
        fridgeInterior.add(container)
      }

      // 第三层 - 新鲜食材
      // 鸡蛋托盘
      const mainEggTrayGeometry = new THREE.BoxGeometry(0.25, 0.03, 0.15)
      const mainEggTrayMaterial = new THREE.MeshPhongMaterial({ color: 0xf5f5f5 })
      const mainEggTray = new THREE.Mesh(mainEggTrayGeometry, mainEggTrayMaterial)
      mainEggTray.position.set(0.5, -0.18, 0.3)
      fridgeInterior.add(mainEggTray)

      // 鸡蛋
      const mainEggGeometry = new THREE.SphereGeometry(0.015, 8, 6)
      const mainEggMaterial = new THREE.MeshPhongMaterial({ color: 0xfff8dc })
      for (let i = 0; i < 12; i++) {
        const egg = new THREE.Mesh(mainEggGeometry, mainEggMaterial)
        egg.scale.y = 1.3
        const row = Math.floor(i / 4)
        const col = i % 4
        egg.position.set(0.42 + col * 0.04, -0.16, 0.25 + row * 0.03)
        fridgeInterior.add(egg)
      }

      // 蔬菜抽屉中的蔬菜
      // 生菜
      const drawerLettuceGeometry = new THREE.SphereGeometry(0.06)
      const drawerLettuceMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
      const drawerLettuce = new THREE.Mesh(drawerLettuceGeometry, drawerLettuceMaterial)
      drawerLettuce.scale.set(1, 0.6, 1)
      drawerLettuce.position.set(-0.3, -0.82, 0.1)
      fridgeInterior.add(drawerLettuce)

      // 西红柿
      const drawerTomatoGeometry = new THREE.SphereGeometry(0.04)
      const drawerTomatoMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6347 })
      for (let i = 0; i < 6; i++) {
        const tomato = new THREE.Mesh(drawerTomatoGeometry, drawerTomatoMaterial)
        tomato.position.set(-0.1 + (i % 3) * 0.08, -0.82, -0.1 + Math.floor(i / 3) * 0.08)
        fridgeInterior.add(tomato)
      }

      // 胡萝卜
      const drawerCarrotGeometry = new THREE.CylinderGeometry(0.012, 0.018, 0.1)
      const drawerCarrotMaterial = new THREE.MeshPhongMaterial({ color: 0xFF8C00 })
      for (let i = 0; i < 5; i++) {
        const carrot = new THREE.Mesh(drawerCarrotGeometry, drawerCarrotMaterial)
        carrot.rotation.z = Math.PI / 2
        carrot.position.set(0.2 + i * 0.06, -0.82, 0.2)
        fridgeInterior.add(carrot)
      }

      fridgeInterior.position.set(0, 0.9, 0.35)
      fridgeGroup.add(fridgeInterior)

      // 保存内部组件引用
      fridgeGroup.freezerInterior = freezerInterior
      fridgeGroup.fridgeInterior = fridgeInterior
    }

    // 门开关动画函数
    const toggleUpperDoor = () => {
      if (!fridgeModel || !fridgeModel.upperDoorGroup) return

      const targetRotation = isUpperDoorOpen ? 0 : -Math.PI / 2
      isUpperDoorOpen = !isUpperDoorOpen

      animateDoor(fridgeModel.upperDoorGroup, targetRotation)

      // 开门时切换到第一人称视角
      if (isUpperDoorOpen) {
        // 聚焦到冷冻室内部
        setTimeout(() => {
          animateCameraToInspect(new THREE.Vector3(0.5, 2.8, 1.5), new THREE.Vector3(0, 2.65, 0))
        }, 400)
      } else {
        // 关门时返回原视角
        animateCameraTo(originalCameraPosition, originalCameraTarget)
      }
    }

    const toggleLowerDoor = () => {
      if (!fridgeModel || !fridgeModel.lowerDoorGroup) return

      const targetRotation = isLowerDoorOpen ? 0 : -Math.PI / 2
      isLowerDoorOpen = !isLowerDoorOpen

      animateDoor(fridgeModel.lowerDoorGroup, targetRotation)

      // 开门时切换到第一人称视角
      if (isLowerDoorOpen) {
        // 聚焦到冷藏室内部
        setTimeout(() => {
          animateCameraToInspect(new THREE.Vector3(0.5, 1.2, 1.5), new THREE.Vector3(0, 0.9, 0))
        }, 400)
      } else {
        // 关门时返回原视角
        animateCameraTo(originalCameraPosition, originalCameraTarget)
      }
    }

    const toggleFreezerLid = () => {
      if (!freezerModel || !freezerModel.lidGroup) return

      const targetRotation = isFreezerLidOpen ? 0 : -Math.PI / 3 // 60度开启
      isFreezerLidOpen = !isFreezerLidOpen

      animateFreezerLid(freezerModel.lidGroup, targetRotation)

      // 开盖时切换到第一人称视角
      if (isFreezerLidOpen) {
        // 聚焦到冰柜内部
        setTimeout(() => {
          animateCameraToInspect(new THREE.Vector3(-2.5, 1.8, 1.5), new THREE.Vector3(-3, 0.8, 1))
        }, 500)
      } else {
        // 关盖时返回原视角
        animateCameraTo(originalCameraPosition, originalCameraTarget)
      }
    }

    const animateDoor = (doorGroup, targetRotation) => {
      const startRotation = doorGroup.rotation.y
      const duration = 800 // 动画持续时间(毫秒)
      const startTime = Date.now()

      const animateDoorFrame = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数使动画更自然
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        doorGroup.rotation.y = startRotation + (targetRotation - startRotation) * easeProgress

        if (progress < 1) {
          requestAnimationFrame(animateDoorFrame)
        }
      }

      animateDoorFrame()
    }

    const animateFreezerLid = (lidGroup, targetRotation) => {
      const startRotation = lidGroup.rotation.x
      const duration = 1000 // 冰柜盖子开启稍慢一些
      const startTime = Date.now()

      const animateLidFrame = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // 使用缓动函数使动画更自然
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        lidGroup.rotation.x = startRotation + (targetRotation - startRotation) * easeProgress

        if (progress < 1) {
          requestAnimationFrame(animateLidFrame)
        }
      }

      animateLidFrame()
    }

    // 提示面板收纳功能
    const toggleHint = () => {
      isHintCollapsed.value = !isHintCollapsed.value
    }

    // 选择器收纳功能
    const toggleSelector = () => {
      isSelectorCollapsed.value = !isSelectorCollapsed.value
    }

    // 设备切换功能
    const switchDevice = (device) => {
      currentDevice.value = device

      if (device === 'fridge') {
        // 聚焦到冰箱
        animateCameraTo(new THREE.Vector3(3, 3, 6), new THREE.Vector3(0, 1.8, 0))
        if (freezerModel) freezerModel.visible = true
        if (fridgeModel) fridgeModel.visible = true
      } else if (device === 'freezer') {
        // 聚焦到冰柜
        animateCameraTo(new THREE.Vector3(-1, 2, 3), new THREE.Vector3(-3, 0.6, 1))
        if (freezerModel) freezerModel.visible = true
        if (fridgeModel) fridgeModel.visible = true
      }
    }

    // 相机动画移动
    const animateCameraTo = (targetPosition, targetLookAt, duration = 1500) => {
      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()
      const startTime = Date.now()

      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
        controls.target.lerpVectors(startTarget, targetLookAt, easeProgress)
        controls.update()

        if (progress < 1) {
          requestAnimationFrame(animateCamera)
        }
      }

      animateCamera()
    }

    // 第一人称检查视角
    const animateCameraToInspect = (targetPosition, targetLookAt, duration = 1200) => {
      isInspectMode = true
      controls.enableRotate = false // 禁用旋转以保持第一人称视角

      const startPosition = camera.position.clone()
      const startTarget = controls.target.clone()
      const startTime = Date.now()

      const animateCamera = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        camera.position.lerpVectors(startPosition, targetPosition, easeProgress)
        controls.target.lerpVectors(startTarget, targetLookAt, easeProgress)
        controls.update()

        if (progress < 1) {
          requestAnimationFrame(animateCamera)
        } else {
          // 动画完成后重新启用控制
          setTimeout(() => {
            controls.enableRotate = true
            isInspectMode = false
          }, 500)
        }
      }

      animateCamera()
    }

    // 加载食物数据
    const loadFoodData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/food')
        if (!response.ok) {
          throw new Error(`HTTP错误: ${response.status}`)
        }
        const foods = await response.json()
        foodData.value = foods

        // 如果3D模型已加载，立即渲染食物
        if (fridgeModel && dynamicFoodGroup) {
          renderDynamicFoods()
        }
      } catch (err) {
        error.value = '无法连接到服务器'
      }
    }

    // 根据存储位置映射到3D坐标 - 基于实际冰箱布局
    const getStoragePosition = (storageLocation, index = 0) => {
      const positions = {
        // 冷藏室上层 (4°C) - 饮料区和蔬果区
        '冰箱上层冷藏室': [
          // 饮料区 (左侧)
          { x: -0.6, y: 2.8, z: -0.2, zone: '饮料区' },
          { x: -0.3, y: 2.8, z: -0.2, zone: '饮料区' },
          { x: -0.6, y: 2.6, z: -0.3, zone: '饮料区' },
          { x: -0.3, y: 2.6, z: -0.3, zone: '饮料区' },
          // 蔬果区 (右侧)
          { x: 0.2, y: 2.8, z: -0.2, zone: '蔬果区' },
          { x: 0.5, y: 2.8, z: -0.2, zone: '蔬果区' },
          { x: 0.2, y: 2.6, z: -0.3, zone: '蔬果区' },
          { x: 0.5, y: 2.6, z: -0.3, zone: '蔬果区' }
        ],
        
        // 冷藏室中层 (3°C) - 主要存储区
        '冰箱中层冷藏室': [
          { x: -0.6, y: 2.0, z: -0.2 },
          { x: -0.3, y: 2.0, z: -0.2 },
          { x: 0, y: 2.0, z: -0.2 },
          { x: 0.3, y: 2.0, z: -0.2 },
          { x: 0.6, y: 2.0, z: -0.2 },
          { x: -0.6, y: 1.8, z: -0.3 },
          { x: -0.3, y: 1.8, z: -0.3 },
          { x: 0, y: 1.8, z: -0.3 },
          { x: 0.3, y: 1.8, z: -0.3 },
          { x: 0.6, y: 1.8, z: -0.3 }
        ],

        // 冷藏室下层 (2°C) - 剩菜保鲜盒区域
        '保鲜盒': [
          { x: -0.4, y: 1.2, z: -0.2, container: '保鲜盒1' },
          { x: -0.1, y: 1.2, z: -0.2, container: '保鲜盒1' },
          { x: 0.2, y: 1.2, z: -0.2, container: '保鲜盒2' },
          { x: 0.5, y: 1.2, z: -0.2, container: '保鲜盒2' },
          { x: -0.4, y: 1.0, z: -0.3, container: '保鲜盒3' },
          { x: -0.1, y: 1.0, z: -0.3, container: '保鲜盒3' },
          { x: 0.2, y: 1.0, z: -0.3, container: '保鲜盒4' },
          { x: 0.5, y: 1.0, z: -0.3, container: '保鲜盒4' }
        ],

        // 冷冻室 (下层冷冻室 -18°C)
        '冰箱下层冷冻室': [
          { x: -0.5, y: 0.6, z: -0.2 },
          { x: -0.2, y: 0.6, z: -0.2 },
          { x: 0.1, y: 0.6, z: -0.2 },
          { x: 0.4, y: 0.6, z: -0.2 },
          { x: -0.5, y: 0.4, z: -0.3 },
          { x: -0.2, y: 0.4, z: -0.3 },
          { x: 0.1, y: 0.4, z: -0.3 },
          { x: 0.4, y: 0.4, z: -0.3 }
        ],

        // 门架区 (6°C) - 调料和小物品
        '冰箱门储物格': [
          { x: 0.85, y: 2.5, z: 0.3, shelf: '上门架' },
          { x: 0.85, y: 2.3, z: 0.3, shelf: '上门架' },
          { x: 0.85, y: 2.1, z: 0.3, shelf: '上门架' },
          { x: 0.85, y: 1.8, z: 0.3, shelf: '中门架' },
          { x: 0.85, y: 1.6, z: 0.3, shelf: '中门架' },
          { x: 0.85, y: 1.4, z: 0.3, shelf: '中门架' },
          { x: 0.85, y: 1.1, z: 0.3, shelf: '下门架' },
          { x: 0.85, y: 0.9, z: 0.3, shelf: '下门架' }
        ],

        // 蔬菜保鲜抽屉
        '蔬菜室': [
          { x: -0.4, y: 0.15, z: -0.2 },
          { x: -0.1, y: 0.15, z: -0.2 },
          { x: 0.2, y: 0.15, z: -0.2 },
          { x: 0.5, y: 0.15, z: -0.2 },
          { x: -0.4, y: 0.15, z: -0.4 },
          { x: -0.1, y: 0.15, z: -0.4 },
          { x: 0.2, y: 0.15, z: -0.4 },
          { x: 0.5, y: 0.15, z: -0.4 }
        ],

        // 冰柜位置
        '冰柜': [
          { x: -2.5, y: 0.8, z: 0.8 },
          { x: -2.8, y: 0.8, z: 0.9 },
          { x: -3.2, y: 0.8, z: 1.0 },
          { x: -2.5, y: 0.6, z: 0.6 },
          { x: -2.8, y: 0.6, z: 0.7 },
          { x: -3.2, y: 0.6, z: 0.8 }
        ]
      }

      // 智能位置匹配 - 根据存储位置和食物类型
      let locationKey = '冰箱中层冷藏室' // 默认位置

      // 精确匹配存储位置
      if (positions[storageLocation]) {
        locationKey = storageLocation
      } else {
        // 模糊匹配
        if (storageLocation.includes('冷冻') || storageLocation.includes('冰冻')) {
          locationKey = '冰箱下层冷冻室'
        } else if (storageLocation.includes('上层')) {
          locationKey = '冰箱上层冷藏室'
        } else if (storageLocation.includes('保鲜') || storageLocation.includes('剩菜')) {
          locationKey = '保鲜盒'
        } else if (storageLocation.includes('蔬菜') || storageLocation.includes('蔬果')) {
          locationKey = '蔬菜室'
        } else if (storageLocation.includes('门') || storageLocation.includes('调料')) {
          locationKey = '冰箱门储物格'
        } else if (storageLocation.includes('冰柜')) {
          locationKey = '冰柜'
        }
      }

      const locationPositions = positions[locationKey] || positions['冰箱中层冷藏室']
      const positionIndex = index % locationPositions.length
      return locationPositions[positionIndex]
    }

    // 根据食物类型创建3D模型 - 更真实的食物外观
    const createFoodModel = (food, position) => {
      const foodGroup = new THREE.Group()

      // 详细的食物颜色和材质配置
      const getFoodAppearance = (food) => {
        const name = food.name.toLowerCase()
        const category = food.category

        // 具体食物的外观配置
        const specificFoods = {
          // 蔬菜类
          '番茄': { color: 0xFF6347, shape: 'sphere', size: 0.04, emoji: '🍅' },
          '西红柿': { color: 0xFF6347, shape: 'sphere', size: 0.04, emoji: '🍅' },
          '生菜': { color: 0x90EE90, shape: 'lettuce', size: 0.05, emoji: '🥬' },
          '白菜': { color: 0xF0FFF0, shape: 'lettuce', size: 0.06, emoji: '🥬' },
          '胡萝卜': { color: 0xFF8C00, shape: 'carrot', size: 0.08, emoji: '🥕' },
          '土豆': { color: 0xDEB887, shape: 'sphere', size: 0.05, emoji: '🥔' },
          '洋葱': { color: 0xFFE4B5, shape: 'sphere', size: 0.04, emoji: '🧅' },
          
          // 水果类
          '苹果': { color: 0xFF0000, shape: 'apple', size: 0.04, emoji: '🍎' },
          '香蕉': { color: 0xFFFF00, shape: 'banana', size: 0.06, emoji: '🍌' },
          '橙子': { color: 0xFFA500, shape: 'sphere', size: 0.04, emoji: '🍊' },
          '葡萄': { color: 0x800080, shape: 'grape', size: 0.03, emoji: '🍇' },
          
          // 肉类
          '鸡肉': { color: 0xFFE4E1, shape: 'meat', size: 0.06, emoji: '🍗' },
          '猪肉': { color: 0xFFB6C1, shape: 'meat', size: 0.07, emoji: '🥩' },
          '牛肉': { color: 0x8B0000, shape: 'meat', size: 0.07, emoji: '🥩' },
          '鱼': { color: 0xC0C0C0, shape: 'fish', size: 0.08, emoji: '🐟' },
          
          // 奶制品
          '牛奶': { color: 0xFFFFF0, shape: 'milk', size: 0.12, emoji: '🥛' },
          '酸奶': { color: 0xFFFACD, shape: 'yogurt', size: 0.05, emoji: '🥛' },
          '奶酪': { color: 0xFFD700, shape: 'cheese', size: 0.04, emoji: '🧀' },
          
          // 饮料
          '可乐': { color: 0x8B4513, shape: 'bottle', size: 0.12, emoji: '🥤' },
          '果汁': { color: 0xFFA500, shape: 'bottle', size: 0.12, emoji: '🧃' },
          '啤酒': { color: 0xDAA520, shape: 'bottle', size: 0.12, emoji: '🍺' },
          
          // 调料
          '盐': { color: 0xFFFFFF, shape: 'jar', size: 0.03, emoji: '🧂' },
          '糖': { color: 0xFFFFF0, shape: 'jar', size: 0.03, emoji: '🍯' },
          '醋': { color: 0x8B4513, shape: 'bottle', size: 0.08, emoji: '🍶' },
          
          // 罐头
          '罐头': { color: 0xC0C0C0, shape: 'can', size: 0.05, emoji: '🥫' }
        }

        // 查找具体食物配置
        for (const [key, config] of Object.entries(specificFoods)) {
          if (name.includes(key)) {
            return config
          }
        }

        // 按类别返回默认配置
        const categoryDefaults = {
          '蔬菜': { color: 0x90EE90, shape: 'box', size: 0.05, emoji: '🥬' },
          '水果': { color: 0xFF6347, shape: 'sphere', size: 0.04, emoji: '🍎' },
          '肉类': { color: 0xDC143C, shape: 'meat', size: 0.06, emoji: '🍗' },
          '奶制品': { color: 0xFFFACD, shape: 'cylinder', size: 0.05, emoji: '🥛' },
          '饮料': { color: 0x87CEEB, shape: 'bottle', size: 0.12, emoji: '🥤' },
          '调料': { color: 0xDEB887, shape: 'jar', size: 0.03, emoji: '🧂' },
          '罐头': { color: 0xC0C0C0, shape: 'can', size: 0.05, emoji: '🥫' },
          '熟食': { color: 0xD2691E, shape: 'box', size: 0.06, emoji: '🍲' },
          '主食': { color: 0xF5DEB3, shape: 'box', size: 0.05, emoji: '🍞' },
          '其他': { color: 0xD3D3D3, shape: 'box', size: 0.05, emoji: '📦' }
        }

        return categoryDefaults[category] || categoryDefaults['其他']
      }

      const appearance = getFoodAppearance(food)
      
      // 创建食物几何体
      let geometry
      switch (appearance.shape) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(appearance.size, 12, 8)
          break
        case 'apple':
          geometry = new THREE.SphereGeometry(appearance.size, 12, 8)
          geometry.scale(1, 1.1, 1) // 苹果形状
          break
        case 'banana':
          geometry = new THREE.CylinderGeometry(0.01, 0.015, appearance.size, 8)
          geometry.rotateZ(Math.PI / 6) // 弯曲效果
          break
        case 'lettuce':
          geometry = new THREE.SphereGeometry(appearance.size, 8, 6)
          geometry.scale(1, 0.6, 1) // 扁平的生菜形状
          break
        case 'carrot':
          geometry = new THREE.CylinderGeometry(0.008, 0.02, appearance.size, 8)
          break
        case 'meat':
          geometry = new THREE.BoxGeometry(appearance.size, appearance.size * 0.4, appearance.size * 0.8)
          break
        case 'fish':
          geometry = new THREE.SphereGeometry(appearance.size * 0.6, 8, 6)
          geometry.scale(1.5, 0.8, 1) // 鱼的形状
          break
        case 'milk':
          geometry = new THREE.BoxGeometry(0.04, appearance.size, 0.03) // 牛奶盒
          break
        case 'yogurt':
          geometry = new THREE.CylinderGeometry(0.025, 0.025, appearance.size, 8)
          break
        case 'cheese':
          geometry = new THREE.BoxGeometry(appearance.size, appearance.size * 0.3, appearance.size)
          break
        case 'bottle':
          geometry = new THREE.CylinderGeometry(0.015, 0.02, appearance.size, 8)
          break
        case 'jar':
          geometry = new THREE.CylinderGeometry(0.02, 0.02, appearance.size, 8)
          break
        case 'can':
          geometry = new THREE.CylinderGeometry(0.025, 0.025, appearance.size, 12)
          break
        case 'grape':
          // 创建葡萄串
          const grapeGroup = new THREE.Group()
          for (let i = 0; i < 6; i++) {
            const grapeGeometry = new THREE.SphereGeometry(0.008, 6, 4)
            const grapeMesh = new THREE.Mesh(grapeGeometry, new THREE.MeshPhongMaterial({ color: appearance.color }))
            grapeMesh.position.set(
              (Math.random() - 0.5) * 0.02,
              i * -0.01,
              (Math.random() - 0.5) * 0.02
            )
            grapeGroup.add(grapeMesh)
          }
          foodGroup.add(grapeGroup)
          geometry = null // 不需要主几何体
          break
        default:
          geometry = new THREE.BoxGeometry(appearance.size, appearance.size, appearance.size)
      }

      // 创建材质
      const material = new THREE.MeshPhongMaterial({
        color: appearance.color,
        shininess: 50,
        transparent: false,
        opacity: 1.0
      })

      // 添加主要食物网格
      if (geometry) {
        const foodMesh = new THREE.Mesh(geometry, material)
        foodMesh.castShadow = true
        foodMesh.receiveShadow = true
        foodGroup.add(foodMesh)
      }

      // 创建emoji标签 (更直观)
      const labelCanvas = document.createElement('canvas')
      labelCanvas.width = 64
      labelCanvas.height = 64
      const labelContext = labelCanvas.getContext('2d')

      // 绘制emoji背景
      labelContext.fillStyle = 'rgba(255, 255, 255, 0.9)'
      labelContext.beginPath()
      labelContext.arc(32, 32, 28, 0, Math.PI * 2)
      labelContext.fill()

      // 绘制边框
      labelContext.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      labelContext.lineWidth = 2
      labelContext.stroke()

      // 绘制emoji
      labelContext.font = '24px Arial'
      labelContext.textAlign = 'center'
      labelContext.textBaseline = 'middle'
      labelContext.fillStyle = 'black'
      labelContext.fillText(appearance.emoji, 32, 32)

      const labelTexture = new THREE.CanvasTexture(labelCanvas)
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        alphaTest: 0.1
      })

      const labelGeometry = new THREE.PlaneGeometry(0.08, 0.08)
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
      labelMesh.position.set(0, appearance.size + 0.05, 0)
      
      // 让标签始终面向相机
      labelMesh.lookAt(camera.position)
      foodGroup.add(labelMesh)

      // 添加过期提示
      if (isExpired(food.expireDate)) {
        const warningGeometry = new THREE.PlaneGeometry(0.06, 0.06)
        const warningCanvas = document.createElement('canvas')
        warningCanvas.width = 32
        warningCanvas.height = 32
        const warningContext = warningCanvas.getContext('2d')
        
        warningContext.fillStyle = 'red'
        warningContext.beginPath()
        warningContext.arc(16, 16, 14, 0, Math.PI * 2)
        warningContext.fill()
        
        warningContext.fillStyle = 'white'
        warningContext.font = '16px Arial'
        warningContext.textAlign = 'center'
        warningContext.fillText('!', 16, 20)
        
        const warningTexture = new THREE.CanvasTexture(warningCanvas)
        const warningMaterial = new THREE.MeshBasicMaterial({
          map: warningTexture,
          transparent: true
        })
        
        const warningMesh = new THREE.Mesh(warningGeometry, warningMaterial)
        warningMesh.position.set(0.04, appearance.size + 0.02, 0)
        foodGroup.add(warningMesh)
      }

      // 设置位置
      foodGroup.position.set(position.x, position.y, position.z)

      // 添加随机旋转，让食物看起来更自然
      foodGroup.rotation.y = Math.random() * Math.PI * 2

      // 添加悬停效果数据
      foodGroup.userData = {
        food: food,
        originalPosition: position,
        isHovered: false,
        appearance: appearance
      }

      // 确保食物组可见
      foodGroup.visible = true
      foodGroup.traverse((child) => {
        if (child.isMesh) {
          child.visible = true
        }
      })

      return foodGroup
    }

    // 渲染动态食物 - 智能分区布局
    const renderDynamicFoods = () => {
      if (!dynamicFoodGroup || !foodData.value.length) return

      // 清除现有的食物对象
      while (dynamicFoodGroup.children.length > 0) {
        dynamicFoodGroup.remove(dynamicFoodGroup.children[0])
      }
      foodObjects.value.clear()

      // 按存储位置和食物类型智能分组
      const locationGroups = {}
      const categoryPriority = {
        '饮料': 'drink',
        '水果': 'fruit', 
        '蔬菜': 'vegetable',
        '奶制品': 'dairy',
        '肉类': 'meat',
        '熟食': 'cooked',
        '调料': 'seasoning',
        '罐头': 'canned'
      }

      foodData.value.forEach(food => {
        let location = food.storageLocation || '冰箱中层冷藏室'
        
        // 智能位置推荐 - 如果用户没有指定合适位置，根据食物类型推荐
        if (location === '冰箱' || location === '冷藏室') {
          switch (food.category) {
            case '饮料':
              location = '冰箱上层冷藏室' // 饮料区
              break
            case '水果':
            case '蔬菜':
              if (food.name.includes('苹果') || food.name.includes('橙子')) {
                location = '冰箱上层冷藏室' // 蔬果区
              } else {
                location = '蔬菜室' // 保鲜抽屉
              }
              break
            case '肉类':
            case '海鲜':
              location = '冰箱下层冷冻室' // 冷冻区
              break
            case '熟食':
              location = '保鲜盒' // 剩菜区
              break
            case '调料':
              location = '冰箱门储物格' // 门架区
              break
            case '奶制品':
              if (food.name.includes('牛奶')) {
                location = '冰箱上层冷藏室' // 饮料区
              } else {
                location = '冰箱中层冷藏室'
              }
              break
            default:
              location = '冰箱中层冷藏室'
          }
        }

        if (!locationGroups[location]) {
          locationGroups[location] = []
        }
        locationGroups[location].push(food)
      })

      // 为每个位置的食物创建3D模型
      Object.entries(locationGroups).forEach(([location, foods]) => {
        // 按类别排序，让同类食物聚集在一起
        foods.sort((a, b) => {
          const aPriority = categoryPriority[a.category] || 'z'
          const bPriority = categoryPriority[b.category] || 'z'
          return aPriority.localeCompare(bPriority)
        })

        foods.forEach((food, index) => {
          const position = getStoragePosition(location, index)
          const foodModel = createFoodModel(food, position)

          // 添加位置信息到userData
          foodModel.userData.location = location
          foodModel.userData.zone = position.zone || position.shelf || position.container || '主区域'

          dynamicFoodGroup.add(foodModel)
          foodObjects.value.set(food._id, foodModel)
        })
      })

      
      // 添加区域标识
      createZoneLabels(locationGroups)
    }

    // 创建存储区域标识
    const createZoneLabels = (locationGroups) => {
      const zonePositions = {
        '冰箱上层冷藏室': { x: 0, y: 3.2, z: 0, label: '冷藏上层 4°C' },
        '冰箱中层冷藏室': { x: 0, y: 2.3, z: 0, label: '冷藏中层 3°C' },
        '保鲜盒': { x: 0, y: 1.4, z: 0, label: '保鲜区 2°C' },
        '冰箱下层冷冻室': { x: 0, y: 0.8, z: 0, label: '冷冻室 -18°C' },
        '冰箱门储物格': { x: 0.9, y: 2.0, z: 0.4, label: '门架区 6°C' },
        '蔬菜室': { x: 0, y: 0.3, z: 0, label: '蔬菜室 4°C' }
      }

      Object.keys(locationGroups).forEach(location => {
        const zoneInfo = zonePositions[location]
        if (!zoneInfo) return

        const labelCanvas = document.createElement('canvas')
        labelCanvas.width = 200
        labelCanvas.height = 40
        const labelContext = labelCanvas.getContext('2d')

        // 绘制半透明背景
        labelContext.fillStyle = 'rgba(0, 0, 0, 0.7)'
        labelContext.fillRect(0, 0, 200, 40)

        // 绘制文字
        labelContext.fillStyle = 'white'
        labelContext.font = '14px Arial'
        labelContext.textAlign = 'center'
        labelContext.fillText(zoneInfo.label, 100, 25)

        const labelTexture = new THREE.CanvasTexture(labelCanvas)
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: labelTexture,
          transparent: true,
          alphaTest: 0.1
        })

        const labelGeometry = new THREE.PlaneGeometry(0.3, 0.06)
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial)
        labelMesh.position.set(zoneInfo.x, zoneInfo.y, zoneInfo.z)
        labelMesh.lookAt(camera.position)
        
        // 添加到动态食物组，这样可以一起管理
        dynamicFoodGroup.add(labelMesh)
      })
    }

    // 检查食物是否过期
    const isExpired = (expireDate) => {
      const today = new Date()
      const expire = new Date(expireDate)
      return expire < today
    }



    // 添加食物交互
    const handleFoodInteraction = (event) => {
      if (!dynamicFoodGroup) return

      const rect = canvasContainer.value.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(dynamicFoodGroup.children, true)

      // 重置所有食物的悬停状态（仅在鼠标移动时）
      if (event.type === 'mousemove') {
        dynamicFoodGroup.children.forEach(foodGroup => {
          if (foodGroup.userData.isHovered) {
            foodGroup.scale.setScalar(1)
            foodGroup.userData.isHovered = false
          }
        })
      }

      if (intersects.length > 0) {
        let foodGroup = intersects[0].object
        // 向上查找直到找到包含食物数据的组
        while (foodGroup && !foodGroup.userData.food) {
          foodGroup = foodGroup.parent
        }

        if (foodGroup && foodGroup.userData.food) {
          // 悬停效果
          if (event.type === 'mousemove') {
            foodGroup.scale.setScalar(1.2)
            foodGroup.userData.isHovered = true
            canvasContainer.value.style.cursor = 'pointer'
          }

          // 点击时显示食物详细信息
          if (event.type === 'click') {
            selectedFood.value = foodGroup.userData.food
          }
        }
      } else if (event.type === 'mousemove') {
        canvasContainer.value.style.cursor = 'default'
      }
    }

    return {
      canvasContainer,
      loading,
      error,
      isHintCollapsed,
      isSelectorCollapsed,
      currentDevice,
      foodData,
      selectedFood,
      toggleHint,
      toggleSelector,
      switchDevice,
      loadFoodData,
      renderDynamicFoods,
      isExpired
    }
  }
}
</script>

<style scoped lang="scss">
.food-map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  /* 减去导航栏高度 */
}

#webgl {
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20px;
  border-radius: 8px;
  font-size: 16px;
}

.error {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 193, 7, 0.9);
  color: #333;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  max-width: 300px;
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  left: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.9));
  color: white;
  border-radius: 0 12px 12px 0;
  font-size: 14px;
  line-height: 1.6;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;

  &.collapsed {
    transform: translateX(-100%);

    .hint-toggle {
      transform: translateX(100%);
      border-radius: 0 8px 8px 0;
    }
  }

  .hint-toggle {
    position: absolute;
    right: -40px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 60px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(135, 206, 235, 0.3), rgba(70, 130, 180, 0.3));
    }

    .toggle-icon {
      color: #87CEEB;
      font-size: 16px;
      font-weight: bold;
    }
  }

  .hint-content {
    padding: 20px;
    min-width: 220px;
  }

  .hint-title {
    font-size: 16px;
    font-weight: bold;
    color: #87CEEB;
    margin-bottom: 15px;
    text-align: center;
  }

  .hint-item {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(5px);
      color: #87CEEB;
    }

    &:last-child {
      margin-bottom: 0;
    }

    .hint-icon {
      margin-right: 10px;
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
  }
}

.device-selector {
  position: absolute;
  top: 20px;
  right: 0;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.9));
  color: white;
  border-radius: 12px 0 0 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-right: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;

  &.collapsed {
    transform: translateX(100%);

    .selector-toggle {
      transform: translateX(-100%);
      border-radius: 8px 0 0 8px;
    }
  }

  .selector-toggle {
    position: absolute;
    left: -40px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 60px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.9));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-right: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba(135, 206, 235, 0.3), rgba(70, 130, 180, 0.3));
    }

    .toggle-icon {
      color: #87CEEB;
      font-size: 16px;
      font-weight: bold;
    }
  }

  .selector-content {
    padding: 15px;
  }

  .selector-title {
    font-size: 14px;
    font-weight: bold;
    color: #87CEEB;
    margin-bottom: 10px;
    text-align: center;
  }

  .selector-buttons {
    display: flex;
    gap: 10px;
  }

  .selector-btn {
    padding: 8px 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    &.active {
      background: linear-gradient(135deg, #87CEEB, #4682B4);
      border-color: #87CEEB;
      box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
    }
  }

  .food-count {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);

    .count-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      color: #87CEEB;

      .count-icon {
        margin-right: 8px;
        font-size: 16px;
      }
    }

    .refresh-btn {
      background: rgba(135, 206, 235, 0.2);
      border: 1px solid rgba(135, 206, 235, 0.4);
      color: #87CEEB;
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      margin-left: 10px;

      &:hover {
        background: rgba(135, 206, 235, 0.3);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }


  }
}

.food-info-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);

  .food-info-content {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.95));
    border-radius: 16px;
    padding: 0;
    max-width: 400px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.5),
      0 8px 20px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);

    .food-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(135deg, rgba(135, 206, 235, 0.2), rgba(70, 130, 180, 0.2));

      h3 {
        margin: 0;
        color: #87CEEB;
        font-size: 20px;
        font-weight: bold;
        text-shadow: 0 0 8px rgba(135, 206, 235, 0.4);
      }

      .close-btn {
        background: none;
        border: none;
        color: #87CEEB;
        font-size: 24px;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(135, 206, 235, 0.2);
          transform: scale(1.1);
        }
      }
    }

    .food-info-body {
      padding: 25px;
      color: white;

      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding: 12px 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(5px);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 600;
          color: #87CEEB;
          min-width: 80px;
        }

        .info-value {
          text-align: right;
          flex: 1;
          margin-left: 15px;

          &.expired {
            color: #ff6b6b;
            font-weight: bold;
            animation: pulse 2s infinite;
          }
        }
      }
    }
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}
</style>