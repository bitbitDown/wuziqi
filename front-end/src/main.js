import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from './lang/i18n.js'   //语言
import Socketio from "@/plugins/socket.io";
const app= createApp(App)
app.use(i18n)
app.use(Socketio, {
  connection:"http://192.168.1.102:3000",// "/* 这里填写服务端地址，如 http://localhost:3000 */",
  options: {
    autoConnect: false, //关闭自动连接
    // ...其它选项
  },
});
app.mount('#app')
