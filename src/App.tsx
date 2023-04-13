import * as React from "react";
import { Form, InputNumber, Button, Radio, Image } from "antd";
import referImg from './assets/risk.jpg';
import "./App.css"

type TBuyInsuranceCount = "2" | "3" | "4" | "5" | "6";;
interface IFormValue {
  lastPayBiz: number;
  lastPayForce: "1045" | "950" | "855" | "760" | "665";
  buyInsuranceCount: TBuyInsuranceCount;
  yearForceRiskCount: number;
  isUseForce: '1' | '0';
  yearRiskCount1: number;
  yearRiskCount2?: number;
  yearRiskCount3?: number;
  yearRiskCount4?: number;
  yearRiskCount5?: number;
}

const NCDCount = [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.7, 0.6, 0.5];
const initNCDCountIndex = 5;
const ForceInsurancePay = [1045, 950, 855, 760, 665];
const initForcePayIndex = 1;


const findForceNextIndex = (lastPayForce: string) => {
  const lastForcePayIndex = ForceInsurancePay.findIndex(v => v === Number(lastPayForce));
  let nextForcePayIndex: number;
  if (lastForcePayIndex <= 1) {
    nextForcePayIndex = 2;
  } else {
    nextForcePayIndex = lastForcePayIndex + 1;
    nextForcePayIndex = nextForcePayIndex >= ForceInsurancePay.length ? ForceInsurancePay.length - 1 : nextForcePayIndex;
  }
  return nextForcePayIndex;
}

const fillIndex = (oNextIndexs: number[], i: number) => {
  if (oNextIndexs[i] >= ForceInsurancePay.length - 1) {
    oNextIndexs.push(ForceInsurancePay.length - 1);
  } else {
    oNextIndexs.push(oNextIndexs[i] + 1);
  }
}

const NCDCountMap = {
  '4y0r': 0.5,
  '3y0r': 0.6,
  '2y0r': 0.7,
  '3y1r': 0.7,
  '1y0r': 0.8,
  '2y1r': 0.8,
  '3y2r': 0.8,
  '0y0r': 1,
  '1y1r': 1,
  '2y2r': 1,
  '3y3r': 1,
  '1y2r': 1.2,
  '2y3r': 1.2,
  '3y4r': 1.2,
  '1y3r': 1.4,
  '2y4r': 1.4,
  '3y5r': 1.4,
  '1y4r': 1.6,
  '2y5r': 1.6,
  '3y6r': 1.6,
  '1y5r': 1.8,
  '2y6r': 1.8,
  '3y7r': 1.8,
  '1y6r': 2,
  '2y7r': 2,
  '3y8r': 2,
};

const computeBizCounts = (buyInsuranceCount: TBuyInsuranceCount, yearRiskCountList: number[]) => {
  const years = [1, 2, 3, 4].map((y, i) => {
    let newY = Number(buyInsuranceCount) - 2 + y;
    return newY;
  });
  const counts: number[] = [];
  const len = 4;
  const recent3YearRiskTimes = yearRiskCountList.slice(0, 3).reduce((t, n) => t + n);
  years.forEach((y, i) => {
    let key: string;
    if (counts[i - 1] === 0.6) {
      key = `4y0r`;
    } else if (i === 3) {
      key = yearRiskCountList[0] > 0 ? `3y0r` : `4y0r`;
    } else if (recent3YearRiskTimes > 0) {
      const year = y > 3 ? 3 : y;
      const rangeTotalRiskTimes = yearRiskCountList.slice(0, len - i - 1).reduce((t, n) => t + n);;
      key = `${year}y${rangeTotalRiskTimes}r`;
    } else {
      const year = y > 4 ? 4 : y;
      const rangeTotalRiskTimes = yearRiskCountList.slice(0, len - i - 1).reduce((t, n) => t + n);;
      key = `${year}y${rangeTotalRiskTimes}r`;
    }
    counts.push(NCDCountMap[key as keyof typeof NCDCountMap]);
  });
  return counts;
}

const MAX_TIMES = 4;

export default function App() {
  const [form] = Form.useForm<IFormValue>();
  const buyInsuranceCountString = Form.useWatch("buyInsuranceCount", form);
  const yearForceRiskCountString = Form.useWatch("yearForceRiskCount", form);
  const buyInsuranceCountNum = Number(buyInsuranceCountString);
  const yearForceRiskCountNum = Number(yearForceRiskCountString);

  const [lastYearCountState, setLastYearCountState] = React.useState<number>(0);

  const [oForcePays, setOForcePays] = React.useState<number[]>([]);
  const [nForcePays, setNForcePays] = React.useState<number[]>([]);

  const [oBizPays, setOBizPays] = React.useState<number[]>([]);
  const [nBizPays, setNBizPays] = React.useState<number[]>([]);
  const [oBizCounts, setOBizCounts] = React.useState<number[]>([]);
  const [nBizCounts, setNBizCounts] = React.useState<number[]>([]);

  const [firstYearBizPayComputed, setFirstYearBizPay] = React.useState<number>(0);

  const [showResult, setShowResult] = React.useState<boolean>(true);

  const onFinish = (values: IFormValue) => {
    const {
      buyInsuranceCount,
      lastPayBiz,
      lastPayForce,
      yearForceRiskCount,
      isUseForce,
      yearRiskCount1,
      yearRiskCount2 = 0,
      yearRiskCount3 = 0,
      yearRiskCount4 = 0,
      yearRiskCount5 = 0,
    } = values;

    // 交强险
    // 影响下一年交强险的情况：0->1, 下一年是 855 及之后；1->2, 下一年是，950->1045，后面无影响; 2->3+，无影响
    if (yearForceRiskCount >= 3) {
      setOForcePays([1045, 855, 760, 665]);
      setNForcePays([1045, 855, 760, 665]);
    } else if(yearForceRiskCount === 2) {
      if (isUseForce === '1') {
        // 本来是 1 ，这次用了，肯定会用。如果本来是 2，这次不用，就比较蠢了
        setOForcePays([950, 855, 760, 665]);
        setNForcePays([1045, 855, 760, 665]);
      } else {
        setOForcePays([1045, 855, 760, 665]);
        setNForcePays([1045, 855, 760, 665]);
      }
    } else if (yearForceRiskCount === 1) {
      // 本来是 0 ，这次用了
      if (isUseForce === '1') {
        const lastForcePayIndex = ForceInsurancePay.findIndex(v => v === Number(lastPayForce));
        const nextForcePayIndex = initForcePayIndex;
        const oNextIndex = lastForcePayIndex <= 1 ? 2 : lastForcePayIndex + 1 >= ForceInsurancePay.length ? ForceInsurancePay.length - 1 : lastForcePayIndex + 1;
        const oNextIndexs = [oNextIndex];
        const nNextIndexs = [nextForcePayIndex];
        for (let i = 0; i < 3; i ++) {
          fillIndex(oNextIndexs, i);
          fillIndex(nNextIndexs, i);
        }
        setOForcePays(oNextIndexs.map(v => ForceInsurancePay[v]));
        setNForcePays(nNextIndexs.map(v => ForceInsurancePay[v]));
      } else {
        setOForcePays([950, 855, 760, 665]);
        setNForcePays([950, 855, 760, 665]);
      }
    } else {
      // 无有影响
      const nextForcePayIndex = findForceNextIndex(lastPayForce);
      const indexs = [nextForcePayIndex];
      for (let i = 0; i < 3; i ++) {
        fillIndex(indexs, i);
      }
      setOForcePays(indexs.map(v => ForceInsurancePay[v]));
      setNForcePays(indexs.map(v => ForceInsurancePay[v]));
    }


    // 商业险
    const newYearRiskCount5 = yearRiskCount5 === 0 ? 0 : 1; // 只影响 0.5 折的情况
    const yearNRiskCountList = [yearRiskCount1, yearRiskCount2, yearRiskCount3, yearRiskCount4, newYearRiskCount5];
    const yearORiskCountList = [yearRiskCount1 === 0 ? 0 : yearRiskCount1 - 1, yearRiskCount2, yearRiskCount3, yearRiskCount4, newYearRiskCount5];
    // 新车首年商业保险的费用
    let firstYearBizPay: number;
    let riskCount_0Index = initNCDCountIndex + Number(buyInsuranceCount) - 2;
    let lastFewYearsRiskCount: number = 0;
    const START_INDEX = 1;
    const currentMaxTime = Number(buyInsuranceCount) - 2;
    for (let i = START_INDEX; i <= currentMaxTime; i ++) {
      if (currentMaxTime === MAX_TIMES && i === MAX_TIMES && lastFewYearsRiskCount > 0) {
        // 如果 3 年内有出过险，就不用看第 4 年了
        riskCount_0Index --;
        break;
      } else {
        lastFewYearsRiskCount += yearNRiskCountList[i];
      }
    }
    riskCount_0Index -= lastFewYearsRiskCount;
    const lastYearCountIndex = riskCount_0Index < 0 ? 0 : riskCount_0Index;
    const lastYearCount = NCDCount[lastYearCountIndex];
    setLastYearCountState(lastYearCount);
    firstYearBizPay = Math.round(lastPayBiz / lastYearCount);
    setFirstYearBizPay(firstYearBizPay);

    const nextOCounts = computeBizCounts(buyInsuranceCount, yearORiskCountList);
    setOBizCounts(nextOCounts);
    setOBizPays(nextOCounts.map(v => Math.round(v * firstYearBizPay)));
    const nextNCounts = computeBizCounts(buyInsuranceCount, yearNRiskCountList);
    setNBizCounts(nextNCounts);
    setNBizPays(nextNCounts.map(v => Math.round(v * firstYearBizPay)));
  };

  const deltaForcePay = nForcePays.map((v, i) => v - oForcePays[i]).reduce((t, n) => t + n, 0);
  const deltaBizPay = nBizPays.map((v, i) => v - oBizPays[i]).reduce((t, n) => t + n, 0);

  return (
    <div className="App">
      <h1>车险计算器</h1>
      <h2>刮蹭了该不该报保险</h2>
      <Form
        onFinish={onFinish}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        form={form}
        style={{ width: "100%" }}
      >
        <Form.Item
          name="lastPayBiz"
          label="上一年商业保险交了多少元："
          initialValue={5000}
          required
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder={"上一年商业保险交了多少元？不算交强险的"}
          />
        </Form.Item>
        <Form.Item
          name="lastPayForce"
          label="上一次交强险交了多少元："
          initialValue="950"
          required
        >
          <Radio.Group>
            <Radio value="1045"> 1045 </Radio>
            <Radio value="950"> 950 </Radio>
            <Radio value="855"> 855 </Radio>
            <Radio value="760"> 760 </Radio>
            <Radio value="665"> 665 </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="buyInsuranceCount"
          label="下一年是第几年买保险："
          initialValue="2"
          required
        >
          <Radio.Group>
            <Radio value="2"> 2 </Radio>
            <Radio value="3"> 3 </Radio>
            <Radio value="4"> 4 </Radio>
            <Radio value="5"> 5 </Radio>
            <Radio value="6"> 6 及以上 </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="yearForceRiskCount"
          label="今年交强险出险次数："
          initialValue={1}
          required
        >
          <InputNumber style={{ width: "100%" }} placeholder={"今年交强险出险次数"} />
        </Form.Item>
        {
          yearForceRiskCountNum > 0 &&
          <Form.Item
            name="isUseForce"
            label="这次是否报交强险："
            initialValue="1"
            required
          >
            <Radio.Group>
              <Radio value="1"> 是 </Radio>
              <Radio value="0"> 否 </Radio>
            </Radio.Group>
          </Form.Item>
        }
        <Form.Item
          name="yearRiskCount1"
          label="今年商业险出险次数："
          initialValue={1}
          required
        >
          <InputNumber style={{ width: "100%" }} placeholder={"今年商业险出险次数"} />
        </Form.Item>
        {buyInsuranceCountNum >= 3 && (
          <Form.Item
            name="yearRiskCount2"
            label="上年商业险出险次数："
            initialValue={0}
            required
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={"上年商业险出险次数"}
            />
          </Form.Item>
        )}
        {buyInsuranceCountNum >= 4 && (
          <Form.Item
            name="yearRiskCount3"
            label="上上年商业险出险次数："
            initialValue={0}
            required
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={"上上年商业险出险次数"}
            />
          </Form.Item>
        )}
        {buyInsuranceCountNum >= 5 && (
          <Form.Item
            name="yearRiskCount4"
            label="上上上年商业险出险次数："
            initialValue={0}
            required
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={"上上上年商业险出险次数"}
            />
          </Form.Item>
        )}
        {buyInsuranceCountNum >= 6 && (
          <Form.Item
            name="yearRiskCount5"
            label="上上上上年商业险出险次数："
            initialValue={0}
            required
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder={"上上上上年商业险出险次数"}
            />
          </Form.Item>
        )}
        <Form.Item wrapperCol={{ span: 24 }} style={{ display: 'flex', justifyContent: 'center' }}>
          <Button htmlType="submit" type="primary">
            计算
          </Button>
        </Form.Item>
      </Form>
      {
        showResult &&
        <div>
          <div className="div" style={{ color: 'red' }}>!!! 数据是推算的，可能有误差，具体请咨询保险公司 !!!</div>
          <div className="div">===========================</div>
          <div className="div">未来 4 年的交强险【不报保险】约：{oForcePays.join(' | ')}</div>
          <div className="div">未来 4 年的交强险【报保险】约：{nForcePays.join(' | ')}</div>
          <div className="div">如报保险，未来 4 年共计多出约：{deltaForcePay}</div>
          <div className="div" style={{ color: 'red' }}>另外，交强险只能用于第三方，不能用于自己 !!!</div>
          <div className="div">===========================</div>
          <div className="div">上一年买保险时的折扣：{lastYearCountState}</div>
          <div className="div">【推算】新车商业险保险价约：{firstYearBizPayComputed}</div>
          <div className="div">===========================</div>
          <div className="div">未来 4 年的商业险【不报保险】的折扣：{oBizCounts.join(' | ')}</div>
          <div className="div">未来 4 年的商业险【不报保险】约：{oBizPays.join(' | ')}</div>
          <div className="div">未来 4 年的商业险【报保险】的折扣：{nBizCounts.join(' | ')}</div>
          <div className="div">未来 4 年的商业险【报保险】约：{nBizPays.join(' | ')}</div>
          <div className="div">如报保险，未来 4 年共计多出约：{deltaBizPay}</div>
          <div className="div">===========================</div>
          <div className="div">如果自讨腰包的钱比 { deltaBizPay + deltaForcePay } 还多，那就报保险.</div>
          <div className="div" style={{ color: 'red' }}>另外，交强险和商业商折扣与不影响。如果明确交强险能搞掂的，没有动到商业险的，基本都可以报保险。</div>
          <div className="div">===========================</div>
        </div>
      }
      <div className="div">参考:</div>
      <Image src={referImg} />
    </div>
  );
}