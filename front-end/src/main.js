import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import Socketio from "@/plugins/socket.io";
const app= createApp(App)
app.use(Socketio, {
  connection:"http://192.168.1.19:3000",// "/* 这里填写服务端地址，如 http://localhost:3000 */",
  options: {
    autoConnect: false, //关闭自动连接
    // ...其它选项
  },
});
app.mount('#app')
