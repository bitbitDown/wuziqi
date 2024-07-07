import { createI18n } from "vue-i18n";
import en from "./en";
import zh_CN from "./zh_CN";

const messages = {
  en: {
    ...en,
  },
  zh_CN: {
    ...zh_CN,
  },
};

let local = 'zh_CN'
const i18n = createI18n({
  locale: local, // 设置当前语言类型
  legacy: false, // 如果要支持compositionAPI，此项必须设置为false;
  globalInjection: true, // 全局注册$t方法
  silentTranslationWarn: true,// 去掉警告
  missingWarn: false,
  silentFallbackWarn: true,//抑制警告
  missing: (locale, key) => {
  },
  messages,
});

export default i18n;