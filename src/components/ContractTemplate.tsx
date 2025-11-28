
import React, { forwardRef } from 'react';
import { Contract, DomesticCompanyInfo } from '../types';

interface ContractTemplateProps {
  contract: Contract;
  settings: DomesticCompanyInfo;
  mode?: 'preview' | 'generate' | 'hidden';
}

const n2c = (n: number) => {
    const fraction = ['角', '分'];
    const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
    let head = n < 0 ? '欠' : '';
    n = Math.abs(n);
    let s = '';
    for (let i = 0; i < fraction.length; i++) {
        s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
    }
    s = s || '整';
    n = Math.floor(n);
    for (let i = 0; i < unit[0].length && n > 0; i++) {
        let p = '';
        for (let j = 0; j < unit[1].length && n > 0; j++) {
            p = digit[n % 10] + unit[1][j] + p;
            n = Math.floor(n / 10);
        }
        s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整');
};

export const ContractTemplate = forwardRef<HTMLDivElement, ContractTemplateProps>(({ contract, settings, mode = 'preview' }, ref) => {
  const { customerSnapshot: buyer, items, supplierSnapshot: supplier } = contract;
  
  // SAFETY CHECK: Use settings passed as prop (current edit state) or fallback to snapshot
  const finalSupplier = supplier || settings || {
      name: '', address: '', contact: '', phone: '', fax: '',
      taxId: '', bankName: '', bankAccount: '', stampDataUrl: '',
      contractTerms: ''
  };

  const baseStyle: React.CSSProperties = {
    width: '794px',
    backgroundColor: 'white',
    position: 'relative',
    boxSizing: 'border-box',
    fontFamily: '"SimSun", "Songti SC", serif', // Song typeface for contracts
  };

  let containerStyle: React.CSSProperties = { ...baseStyle };
  let wrapperClass = "";

  if (mode === 'preview') {
    containerStyle = {
      ...baseStyle,
      width: '794px', 
      minWidth: '794px',
      minHeight: '1123px',
      margin: '0 auto',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };
    wrapperClass = "flex justify-center min-h-full";
  } else if (mode === 'generate') {
    containerStyle = {
      ...baseStyle,
      minHeight: '1123px', 
      height: 'auto', 
      overflow: 'visible'
    };
    wrapperClass = "absolute top-0 left-0";
  } else {
    containerStyle = { ...baseStyle, display: 'none' };
  }

  return (
    <div className={wrapperClass}>
       <div ref={ref} style={containerStyle} className="text-black bg-white flex flex-col p-10 text-sm leading-relaxed">
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-6 tracking-widest font-sans">产品购销合同</h1>

          {/* Header Info */}
          <div className="border-t-4 border-black mb-1"></div>
          <div className="mb-4">
              <div className="font-bold mb-1">TO:</div>
              <div className="flex justify-between items-center mb-1">
                  <div>签订时间：{contract.date}</div>
                  <div>签订地点： {contract.place}</div>
                  <div>合同编号：{contract.contractNumber}</div>
              </div>
              
              <div className="font-bold text-lg">供方：{finalSupplier.name}</div>
              <div className="font-bold text-lg">需方：{buyer.name}</div>
          </div>

          {/* Table */}
          <div className="mb-2">
              <div className="flex justify-between items-end mb-1">
                  <span>一、 需方向供方购买以下产品：</span>
                  <span>货币单位：人民币 元</span>
              </div>
              <table className="w-full border-collapse border border-black text-center text-xs">
                  <thead>
                      <tr className="h-10">
                          <th className="border border-black p-1 w-8">序号</th>
                          <th className="border border-black p-1 w-12">图片</th>
                          <th className="border border-black p-1 w-24">产品型号</th>
                          <th className="border border-black p-1 w-24">产品名称</th>
                          <th className="border border-black p-1 w-16">品牌</th>
                          <th className="border border-black p-1 w-10">单位</th>
                          <th className="border border-black p-1 w-10">数量</th>
                          <th className="border border-black p-1 w-16">单价</th>
                          <th className="border border-black p-1 w-20">总价</th>
                          <th className="border border-black p-1 w-20">供货周期</th>
                      </tr>
                  </thead>
                  <tbody>
                      {items.map((item, idx) => (
                          <tr key={item.id} className="h-14">
                              <td className="border border-black p-1 text-center">{idx + 1}</td>
                              <td className="border border-black p-1 align-middle">
                                  {item.imageDataUrl ? (
                                      <img src={item.imageDataUrl} alt="" className="w-10 h-10 object-contain mx-auto" />
                                  ) : null}
                              </td>
                              <td className="border border-black p-1 font-bold">{item.sku}</td>
                              <td className="border border-black p-1">{item.name}</td>
                              <td className="border border-black p-1">{item.brand || '-'}</td>
                              <td className="border border-black p-1">{item.unit}</td>
                              <td className="border border-black p-1">{item.quantity}</td>
                              <td className="border border-black p-1">{item.price.toFixed(0)}</td>
                              <td className="border border-black p-1 font-bold">{(item.price * item.quantity).toFixed(0)}</td>
                              <td className="border border-black p-1">{item.leadTime || '现货'}</td>
                          </tr>
                      ))}
                      {/* Empty row for padding if needed, or remarks row */}
                      <tr className="h-8">
                          <td className="border border-black p-1">备注</td>
                          <td className="border border-black p-1 text-left px-2" colSpan={9}></td>
                      </tr>
                      <tr className="h-10 bg-gray-50">
                          <td className="border border-black p-1 font-bold" colSpan={3}>合计 (大写)</td>
                          <td className="border border-black p-1 text-left px-4 font-bold tracking-widest" colSpan={7}>
                              {n2c(contract.totalAmount)} (￥{contract.totalAmount.toFixed(2)} 元)
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          {/* Terms */}
          <div className="text-xs leading-5 whitespace-pre-wrap mb-4 font-serif">
              {contract.terms}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 mt-auto border border-black text-xs">
              {/* Supplier (Left) */}
              <div className="p-2 border-r border-black relative">
                  <div className="mb-1"><span className="font-bold">供方：</span> {finalSupplier.name}</div>
                  <div className="mb-1">地址： {finalSupplier.address}</div>
                  <div className="mb-1">代理人： {finalSupplier.contact}</div>
                  <div className="mb-1">电话： {finalSupplier.phone}</div>
                  <div className="mb-1">传真： {finalSupplier.fax}</div>
                  <div className="mb-1">纳税人识别号： {finalSupplier.taxId}</div>
                  <div className="mb-1">开户行： {finalSupplier.bankName}</div>
                  <div className="mb-1">账号： {finalSupplier.bankAccount}</div>
                  
                  {/* Stamp Overlay */}
                  {finalSupplier.stampDataUrl && (
                      <img 
                        src={finalSupplier.stampDataUrl} 
                        className="absolute top-10 left-10 w-32 h-32 opacity-80 mix-blend-multiply pointer-events-none" 
                        alt="Stamp"
                        crossOrigin="anonymous"
                      />
                  )}
              </div>

              {/* Buyer (Right) */}
              <div className="p-2">
                  <div className="mb-1"><span className="font-bold">需方：</span> {buyer.name}</div>
                  <div className="mb-1">地址： {buyer.address}</div>
                  <div className="mb-1">代理人： {buyer.contactPerson}</div>
                  <div className="mb-1">电话： {buyer.phone}</div>
                  <div className="mb-1">传真： </div>
                  <div className="mb-1">纳税人识别号：{buyer.taxId || ''}</div>
                  <div className="mb-1">开户行： {buyer.bankName || ''}</div>
                  <div className="mb-1">账号： {buyer.bankAccount || ''}</div>
              </div>
          </div>

       </div>
    </div>
  );
});

ContractTemplate.displayName = 'ContractTemplate';
