
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' //导入路由
import 'vant/lib/index.css' //导入vant4样式
import './assets/style/global.css' //导入全局样式
import { PullRefresh, Search, Icon, Tabbar, TabbarItem, Tab, Button, Grid, GridItem, Cell, CellGroup, Image as VanImage, Empty, Popup, Loading, Toast, NavBar, NoticeBar, Dialog, SwipeCell, DropdownMenu, DropdownItem, Field, DatePicker, Picker, Stepper, Tag } from 'vant'//导入vant组件库

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) //使用Pinia状态管理
app.use(router) //使用路由
//按需导入vant组件
app.use(PullRefresh)
app.use(Search)
app.use(Icon)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Tab)
app.use(Button)
app.use(Grid)
app.use(GridItem)
app.use(Cell)
app.use(CellGroup)
app.use(VanImage)
app.use(Empty)
app.use(Popup)
app.use(Loading)
app.use(Toast)
app.use(NavBar)
app.use(NoticeBar)
app.use(Dialog)
app.use(SwipeCell)
app.use(DropdownMenu)
app.use(DropdownItem)
app.use(Field)
app.use(DatePicker)
app.use(Picker)
app.use(Stepper)
app.use(Tag)
app.mount('#app')