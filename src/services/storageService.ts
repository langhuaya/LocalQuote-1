
import { Quote, Product, Customer, CompanySettings } from '../types';

const KEYS = {
  QUOTES: 'sq_quotes',
  PRODUCTS: 'sq_products',
  CUSTOMERS: 'sq_customers',
  SETTINGS: 'sq_settings',
};

// Generated LH WAVE Logo (Blue Gradient Text SVG)
const DEFAULT_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' width='300' height='100'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%2300c6ff;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%230072ff;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ctext x='10' y='70' font-family='Arial, sans-serif' font-weight='bold' font-size='60' fill='url(%23grad1)'%3ELH WAVE%3C/text%3E%3C/svg%3E";

const DEFAULT_DOMESTIC_TERMS = `一、 需方向供方购买以下产品：
二、 质量要求技术标准、供方对质量负责的条件和期限：按厂方出厂技术标准，保修一年，易耗品不保修，没有质量问题不接受退换货，在正常使用情况下，产生质量问题，在保修时间内给予保修。特殊殊说明之外。商品属人为损坏、私自拆卸、易碎标签人为破损将视为主动放弃保修权利。
三、 交（提）货地点、方式： 快递。
四、 运输方式、 到达站港及保价金额和费用负担：运费现付
六、 包装标准、包装物的供应与回收： 出厂包装。
七、 验收标准、方法及提出异议期限：按需方提供技术指标验收。
八、 随机备品、配件工具数量及供应方法：以装箱单为准。
九、 结算方式及期限：款到发货。
十、 如需提供担保，另立合同担保书，作为本合同附件： 无。
十一、 违约责任： 按中华人民共和国民法典(合同编) 有关规定执行。
十二、 解决合同纠纷的方式： 供需双方友好协商解决。
十三、 其它约定事项： 以上价格含 13%税专用发票（以需方通知后开票）
本合同由双方授权代表签字， 双方单位盖章并符合以上条例即生效。传真件同样有效。`;

export const storageService = {
  // --- Settings ---
  getSettings: (): CompanySettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    let settings: CompanySettings;

    if (data) {
        settings = JSON.parse(data);
        if (!settings.exchangeRates) {
            settings.exchangeRates = { "USD": 1, "CNY": 7.20, "EUR": 0.92, "GBP": 0.79 };
        }
    } else {
        settings = {
          name: 'LH WAVE TRADING CO., LTD.',
          address: '123 Ocean Business Park, Coastal Road',
          city: 'Shenzhen',
          country: 'China',
          phone: '+86 755 1234 5678',
          email: 'sales@lhwave.com',
          logoDataUrl: DEFAULT_LOGO,
          stampDataUrl: '',
          bankInfo: 'BENEFICIARY: LH WAVE TRADING CO., LTD.\nBANK: BANK OF CHINA\nSWIFT: BKCHCNBJ300\nA/C NO: 1234567890123456',
          quotePrefix: 'LH-',
          productUnits: 'PCS, SET, BOX, CTN, KG, M, ROLL, PACK, PAIR, UNIT, KIT, DRUM, BAG, DOZ',
          exchangeRates: {
            "USD": 1,
            "CNY": 7.20,
            "EUR": 0.92,
            "GBP": 0.79
          },
          domestic: {
             name: '深圳市劲浩伟业科技有限公司',
             address: '深圳市宝安区新桥街道新桥社区新桥三路 27 号卓越时代大厦 601',
             contact: '欧小姐',
             phone: '0755-82519902',
             fax: '0755-82519902',
             taxId: '91440300597754293Q',
             bankName: '中国建设银行股份有限公司深圳新桥支行',
             bankAccount: '44250100017900001929',
             stampDataUrl: '',
             contractTerms: DEFAULT_DOMESTIC_TERMS,
             contractPrefix: 'ULHTZH'
          }
        };
    }
    
    // Ensure domestic object exists if migrating from old version
    if (!settings.domestic) {
        settings.domestic = {
             name: 'Domestic Company Name',
             address: 'Domestic Address',
             contact: 'Contact Person',
             phone: '',
             fax: '',
             taxId: '',
             bankName: '',
             bankAccount: '',
             stampDataUrl: '',
             contractTerms: DEFAULT_DOMESTIC_TERMS,
             contractPrefix: 'ULHTZH'
        };
    }
    // Polyfill prefix if missing from existing domestic object
    if (!settings.domestic.contractPrefix) {
        settings.domestic.contractPrefix = 'ULHTZH';
    }
    // Polyfill units
    if (!settings.productUnits) {
        settings.productUnits = 'PCS, SET, BOX, CTN, KG, M, ROLL, PACK, PAIR, UNIT, KIT, DRUM, BAG, DOZ';
    }
    
    return settings;
  },
  saveSettings: (settings: CompanySettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },
};
