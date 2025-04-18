import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './lang/i18n.js'   //语言
import Socketio from "@/plugins/socket.io";

// 创建应用实例
const app = createApp(App)

// 注册插件
app.use(i18n)
app.use(Socketio, {
  // connection:"http://192.168.1.102:3000",// "/* 这里填写服务端地址，如 http://localhost:3000 */",
  connection:"http://192.168.1.23:3000",// "/* 这里填写服务端地址，如 http://localhost:3000 */",
  options: {
    autoConnect: false, //关闭自动连接
    // ...其它选项
  },
});

// 全局属性
app.config.globalProperties.$theme = {
  primary: '#f59e0b',
  secondary: '#ffe4c7',
  textPrimary: '#333333',
  textSecondary: '#666666'
};

// 挂载应用
app.mount('#app')
