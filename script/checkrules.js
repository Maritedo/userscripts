/**
 * @type {Map<string, HTMLElement>}
 */
/**
 *
 * @param {{func: ()=>{}, msg: string}[]} rules_
 * @param {string} val_
 * @param {boolean} allowBlank
 */
var ruleTest = (rules_, val_, allowBlank = false) => {
  if (val_.length == 0) return allowBlank ? null : "不可为空";
  if (!rules_) return null;
  const failure = rules_.find((v) => {
    return v.func(val_);
  });
  return failure ? failure.msg : null;
};

const rules = {
  //return TRUE if fail else FALSE
  username: [
    {
      func: (e) => {
        const reg = /^[0-9a-zA-Z-_\+]+$/;
        return !reg.test(e);
      },
      msg: "包含非法字符！",
    },
    {
      func: (e) => {
        return e.length < 4;
      },
      msg: "用户名不足4位！",
    },
    {
      func: (e) => {
        return e.length > 18;
      },
      msg: "用户名超过18位！",
    },
  ],
  password: [
    {
      func: (e) => {
        return e.length < 6;
      },
      msg: "密码不足6位！",
    },
    {
      func: (e) => {
        return e.length > 10;
      },
      msg: "密码超过10位！",
    },
    {
      func: (e) => {
        return false;
      },
      msg: "密码包含非法字符！",
    },
  ],
  password_confirm: [
    {
      func: (e) => {
        if (e) return e != $('#password').value;
        return true;
      },
      msg: "密码输入不一致！",
    },
  ],
  security_question: [
    {
      func: (e) => {
        return e.length < 6;
      },
      msg: "问题过短！",
    },
    {
      func: (e) => {
        return e.length > 30;
      },
      msg: "问题过长！",
    },
  ],
  sec_ques_ans: [
    {
      func: (e) => {
        return e.length < 6;
      },
      msg: "答案过短！",
    },
    {
      func: (e) => {
        return e.length > 30;
      },
      msg: "答案过长！",
    },
  ],
  security_email: [
    {
      func: (e) => {
        const reg_ = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        return !reg_.test(e);
      },
      msg: "邮箱格式错误！",
    },
  ],
  name: [
    {
      func: (e) => {
        const reg_ = /^[\u4E00-\u9FA5]+$/;
        return !reg_.test(e);
      },
      msg: "姓名包含非中文字符！",
    },
    {
      func: (e) => {
        return e.length > 20;
      },
      msg: "姓名过长！",
    },
  ],
  // "gender": [

  // ],
  idcode: [
    {
      func: (e) => {
        return e.length != 18;
      },
      msg: "身份证位数错误",
    },
    {
      func: (e) => {
        const reg = new RegExp(
          "^" +
          "[1-9]\\d{5}" + // 6位地区码
          "(19|([23]\\d))\\d{2}" + // 年YYYY
          "((0[1-9])|(10|11|12))" + // 月MM
          "(([0-2][1-9])|10|20|30|31)" + // 日DD
          "\\d{3}" + // 3位顺序码
          "[0-9Xx]" + // 校验码
          "$"
        );
        return (
          !reg.test(e) ||
          (function (v) {
            const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            const V = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
            let sum = 0;
            for (const index in W) {
              sum += W[index] * parseInt(e[index]);
            }
            return e[17] != V[sum % 11];
          })(e)
        );
      },
      msg: "身份证验证不通过",
    },
    {
      func: (e) => {
        const isLunar = (y) => {
          return (!(y % 4) && y % 100) || !(y % 400);
        };
        const year = parseInt(e.slice(6, 6 + 4));
        const month = parseInt(e.slice(10, 10 + 2));
        const day = parseInt(e.slice(12, 12 + 2));
        return (
          day >
          [31, isLunar(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
          month - 1
          ]
        );
      },
      msg: "无效的日期",
    },
  ],
  // birthday: [

  // ],
  // "address_province": [

  // ],
  // "address_city": [

  // ],
  // "address_region": [

  // ],
  // "interest": [

  // ],
  address: [
    {
      func: (e) => { },
      msg: "",
    },
  ],
  mailcode: [
    {
      func: (e) => {
        const reg_ = /^[0-9]+$/;
        return !reg_.test(e);
      },
      msg: "邮政编码格式错误！",
    },
  ]
};