/*外层九宫格,包含9个内层九宫格,数组放的是九宫格每个格子对应的位置及值,第N行第N个格子*/
var outerGrid;
/*内层九宫格,被包含在外层九宫格里,数组放的是九宫格每个格子对应的位置及值,第N个小九宫格第N个格子*/
var innerGrid;

/**用于记录每次输入的状态 */
var inputStatusArr = [];
var currentInputStatusIndex = -1;
$(document).ready(function () {
  buildGrid();
  initSubjectList();
});

function setInputValue(index, value) {
  $(".outer" + index + " .inputAnswer").val(value);
  inputValue($(".outer" + index + " .inputAnswer"));
}

/**设置笔记值 */
function setNoteValue(index, value) {
  setELENoteValue($(".outer" + index + " .inputNote"), value);
}

/**格式化后再设置笔记值 */
function setELENoteValue(ele, value) {
  value = replaceFh(value, " ", ",");
  value = replaceFh(value, ",,", ",");
  ele.val(value);
}

/**递归替换多余的符号 */
function replaceFh(value, regexp, replacement) {
  if (value.indexOf(regexp) != -1) {
    value = value.replace(regexp, replacement);
    return replaceFh(value, regexp, replacement);
  } else {
    return value;
  }
}

/*格子输入值后的操作,需要往grid中对于位置值以及检查冲突*/
function inputValue(inputEle, isUserInput) {
  /**如果是用户输入则记录状态以供撤回 */
  if (isUserInput) {
    /** 如果当前记得的状态数组比当前状态所在index大则需要把当前状态所在index后面的状态全清空 */
    if (inputStatusArr.length - 1 > currentInputStatusIndex) {
      inputStatusArr.splice(currentInputStatusIndex + 1);
    }
    /**记录当前状态 */
    var length = inputStatusArr.push(getCurrentStatus());
    if (length > 10 + 1) {
      /**最多只记录最近10次的状态 */
      inputStatusArr.shift();
    } else {
      currentInputStatusIndex++;
    }
  }
  var value = inputEle.val();
  var liEle = inputEle.parents("li");
  if (value) {
    liEle.find(".inputNote").val("");
    liEle.attr("value", value);
  } else {
    liEle.removeAttr("value");
  }
  var outerIndex = getOuterIndex(liEle);
  var innerIndex = getInnerIndex(liEle);
  /*把当前给这个的数字放入 outerGrid 和innerGrid对应的位置*/
  addGrid(outerGrid, outerIndex, value);
  addGrid(innerGrid, innerIndex, value);
  checkError(liEle, inputEle, outerIndex, innerIndex);
  checkNote(value, outerIndex, innerIndex);
}

/**检查相关格子笔记去掉输入的值 */
function checkNote(inputValue, outerIndex, innerIndex) {
  //   var inputValue = inputEle.val();
  if (!inputValue) {
    return;
  }
  var value;
  eachAboutGrid(outerIndex, innerIndex, (gridIndex, type) => {
    var noteEle;
    if (type) {
      noteEle = $(".outer" + gridIndex).find(".inputNote");
    } else {
      noteEle = $(".inner" + gridIndex).find(".inputNote");
    }
    deleteNoteValue(noteEle, inputValue);
  });
}
function deleteNoteValue(noteEle, inputValue) {
  var value = noteEle.val();
  if (value && value.indexOf(inputValue) != -1) {
    value = value.trim();
    value = value.replace(" ", ",") + ",";
    value = value.replace(inputValue + ",", "");
    value = value.substring(0, value.length - 1);
    setELENoteValue(noteEle, value);
  }
}

/*检查错误标记冲突*/
function checkError(liEle, inputEle, outerIndex, innerIndex) {
  /*移除因为自己的输入导致冲突的所有class*/
  $(".conflict" + outerIndex).removeClass("conflict" + outerIndex);

  /*移除因为其他格子输入导致自己冲突的class*/
  var classNames = liEle.prop("class").split(" ");
  for (var index in classNames) {
    var className = classNames[index];
    if (className.indexOf("conflict") != -1) {
      var classArr = $("." + className);
      if (classArr.length > 2) {
        /*如果其他格子导致的冲突大于两个,则只要移除自己的冲突class*/
        liEle.removeClass(className);
      } else {
        /*否则把其他格子和自己的冲突样式移除*/
        classArr.removeClass(className);
      }
    }
  }
  var inputValue = inputEle.val();
  if (!inputValue) {
    return;
  }

  //检查存在冲突的格子加冲突样式
  var isConflict = false;
  eachAboutGrid(outerIndex, innerIndex, (gridIndex, type) => {
    if (type) {
      value = outerGrid[gridIndex[0]][gridIndex[1]];
      if (inputValue == value) {
        $(".outer" + gridIndex).addClass("conflict" + outerIndex);
        isConflict = true;
      }
    } else {
      value = innerGrid[gridIndex[0]][gridIndex[1]];
      if (inputValue == value) {
        $(".inner" + gridIndex).addClass("conflict" + outerIndex);
        isConflict = true;
      }
    }
  });
  /*
    自己循环检查
     for (var i = 1; i <= 9; i++) {
    var index = i + "";
    var value;
    if (index != outerIndex[1]) {
      value = outerGrid[outerIndex[0]][index];
      if (inputValue == value) {
        $(".outer" + outerIndex[0] + index).addClass(
          "conflict" + outerIndex
        );
        isConflict = true;
      }
    }
    if (index != outerIndex[0]) {
      value = outerGrid[index][outerIndex[1]];
      if (inputValue == value) {
        $(".outer" + index + outerIndex[1]).addClass(
          "conflict" + outerIndex
        );
        isConflict = true;
      }
    }
    if (index != innerIndex[1]) {
      value = innerGrid[innerIndex[0]][index];
      if (inputValue == value) {
        $(".inner" + innerIndex[0] + index).addClass(
          "conflict" + outerIndex
        );
        isConflict = true;
      }
    }
  } 
  */
  if (isConflict) {
    liEle.addClass("conflict" + outerIndex);
  }
}

/*构建九宫格div*/
function buildGrid() {
  outerGrid = [[], [], [], [], [], [], [], [], [], []];
  innerGrid = [[], [], [], [], [], [], [], [], [], []];
  var ulArr = [];
  var html = "<ul>";
  for (var i = 1; i <= 9; i++) {
    for (var j = 1; j <= 9; j++) {
      // 		<li class="outer11 inner11">
      // 	<p><input type="text" class="inputNote"></p>
      // 	<p><input type="text" class="inputAnswer"></p>
      // </li>
      //第i行第j列
      var outerIndex = i + "" + j;
      //第几个内部九宫格，
      //ceil(j / 3): 1-3列=1 4-6列=2 7-9列=3
      //Math.floor(i / 3) * 3:  则1-3行=0 4-6行=3 7-9行=6
      //所以inner1代表: 1-3行及1-3列 1+0 = 第1个内部九宫格， 4-6列及7-9行 2+6 第8个内部九宫格
      var inner1 = Math.ceil(j / 3) + Math.floor((i - 1) / 3) * 3;
      //第inner1个的内部九宫格的第几个格子
      //(j -1)% 3 +1: 列1-4-7 = 1,2-5-8=2,3-6-9=3
      //(i-1)%3 *3: 行1-4-7 = 0,2-5-8=3,3-6-9=6
      //所以inner2代表: 第1行第1列 = 1+0 =1;第2行第5列=2+3=5
      var inner2 = ((j - 1) % 3) + 1 + ((i - 1) % 3) * 3;
      //第inner1个内部九宫格的第inner2个格子
      var innerIndex = inner1 + "" + inner2;
      var ulHtml = ulArr[inner1];
      if (!ulHtml) {
        ulHtml = "<ul>";
      }
      ulHtml += '<li class="outer' + outerIndex + " inner" + innerIndex + '">';
      ulHtml +=
        '<p><input type="text" class="inputNote"></p><p><input type="text" class="inputAnswer"></p></li>';
      ulArr[inner1] = ulHtml;

      // html += '<li class="outer' + outerIndex + ' inner' + innerIndex + '">';
      // html += '<p><input type="text" class="inputNote"></p><p><input type="text" class="inputAnswer"></p></li>';
    }
  }
  html = "";
  for (var i in ulArr) {
    html += ulArr[i] + "</ul>";
  }
  $(".grid").html(html);

  /*每个格子数字失焦事件*/
  $(".inputAnswer").blur(function () {
    var inputEle = $(this);
    inputValue(inputEle, true);
  });

  /**鼠标进入事件标记相关格子 */
  $(".grid li").mouseover(function () {
    var ele = $(this);
    /*给相关格子加class */
    ele.addClass("aboutGrid");
    eachEleAboutGrid(ele, (gridIndex, type) => {
      if (type) {
        $(".outer" + gridIndex).addClass("aboutGrid");
      } else {
        $(".inner" + gridIndex).addClass("aboutGrid");
      }
    });

    /*给当前值加class */
    var value = ele.find(".inputAnswer").val();
    $(".grid li[value=" + value + "]").addClass("aboutValue");
  });

  /**鼠标移出事件标记相关格子 */
  $(".grid li").mouseleave(function () {
    var ele = $(this);
    /*给相关格子移除class */
    ele.removeClass("aboutGrid");
    eachEleAboutGrid(ele, (gridIndex, type) => {
      if (type) {
        $(".outer" + gridIndex).removeClass("aboutGrid");
      } else {
        $(".inner" + gridIndex).removeClass("aboutGrid");
      }
    });

    /*给当前值移除class */
    $(".aboutValue").removeClass("aboutValue");
  });

  /*每个格子数字失焦事件*/
  $(".inputNote").blur(function () {
    var inputEle = $(this);
    var value = inputEle.val();
    value = setELENoteValue(inputEle, value);
  });

  bindRightMouse();

  // html += "</ul>";
  // $(".grid").html(html)
}

/*把当前所有有值得格子标记成题目格子*/
function createSubject() {
  $(".inputAnswer").each(function () {
    var currentEle = $(this);
    if (currentEle.val()) {
      setSubjectStyle(currentEle);
    }
  });
  // 创建题目时记录题目状态提供第一次输入也能撤回,但需要考虑撤回的时候不要记录题目状态,否则会有bug
  //   inputStatusArr.push(getCurrentStatus());
  //   currentInputStatusIndex++;
}

/*导出题目为json*/
function exportSubject() {
  var subject = getSubject();
  var json = JSON.stringify(subject);
  $("#subjectInput").val(json);
  return json;
}

/*导入题目*/
function importSubject(subjectArr) {
  buildGrid();
  if (!subjectArr) {
    var subjectArr = JSON.parse($("#subjectInput").val());
  }
  for (var i in subjectArr) {
    var subject = subjectArr[i];
    setInputValue(subject.position, subject.value);
  }
  createSubject();
}

/*重置题目*/
function resetSubject() {
  //此代码也能重置 但是需要自己处理重置逻辑
  // $("li:not(.subject) .inputAnswer").val("");
  // /*外层九宫格,包含9个内层九宫格,数组放的是九宫格每个格子对应的位置及值,第N行第N个格子*/
  // outerGrid = [[], [], [], [], [], [], [], [], [], []];
  // /*内层九宫格,被包含在外层九宫格里,数组放的是九宫格每个格子对应的位置及值,第N个小九宫格第N个格子*/
  // innerGrid = [[], [], [], [], [], [], [], [], [], []];
  // $("[class*=conflict]").each((index, ele) => {
  //   ele = $(ele);
  //   var classNames = ele.prop("class").split(" ");
  //   for (var i in classNames) {
  //     if (classNames[i].indexOf("conflict") != -1) {
  //       ele.removeClass(classNames[i]);
  //     }
  //   }
  // });

  //重置
  $("li:not(.subject) .inputAnswer").each((index, ele) => {
    ele = $(ele);
    ele.val("");
    inputValue(ele);
  });
}

/*清空表格*/
function clearGrid() {
  buildGrid();
}

function setSubjectStyle(ele) {
  ele.prop("readonly", "true");
  ele.parents("li").find(".inputNote").prop("readonly", "true");
  ele.parents("li").addClass("subject");
}

function exportStatus() {
  var status = getCurrentStatus();
  var json = JSON.stringify(status);
  $("#subjectInput").val(json);
}

function importStatus() {
  var status = JSON.parse($("#subjectInput").val());
  importSubject(status.subject);
  importAnswer(status.answer);
}

/*用于保存每次点记录的格子状态 */
var recordStatusArr = [];

/**获取当前所有格子的状态 */
function getCurrentStatus() {
  var subject = getSubject();
  var answer = getAnswer();
  var status = {
    subject: subject,
    answer: answer,
    time: new Date().format(YYYY_MM_DD_HH_MM_SS),
  };
  return status;
}

/** 记录格子的状态并存储 */
function recordStatus() {
  var subject = getSubject();
  var answer = getAnswer();
  var length = recordStatusArr.unshift(getCurrentStatus());
  if (length > 10) {
    recordStatusArr.pop();
  }
  var html = "";
  recordStatusArr.forEach((record, i) => {
    var liHtml =
      "<li ondblclick='restoreRecord(" + i + ")'>" + record.time + "</li>";
    html += liHtml;
  });
  $("#recordList").html(html);
}

/**从记录点恢复状态 */
function restoreRecord(index) {
  var record = recordStatusArr[index];
  importSubject(record.subject);
  importAnswer(record.answer);
}

/**撤回到上一次输入的状态 */
function withdrawLast() {
  if (currentInputStatusIndex != 0) {
    currentInputStatusIndex--;
    var status = inputStatusArr[currentInputStatusIndex];
    importSubject(status.subject);
    importAnswer(status.answer);
  }
}

/**恢复到上一次撤回 */
function resumeLast() {
  if (currentInputStatusIndex < inputStatusArr.length - 1) {
    currentInputStatusIndex++;
    var status = inputStatusArr[currentInputStatusIndex];
    importSubject(status.subject);
    importAnswer(status.answer);
  }
}
/*获得题目*/
function getSubject() {
  var subject = [];
  $(".subject").each((i, liEle) => {
    liEle = $(liEle);
    var value = liEle.find(".inputAnswer").val();
    if (value) {
      var outerIndex = getOuterIndex(liEle);
      subject.push({ position: outerIndex, value: value });
    }
  });
  return subject;
}

/*获得答案*/
function getAnswer() {
  var answer = [];
  $(".grid li:not(.subject)").each((i, liEle) => {
    liEle = $(liEle);
    var value = liEle.find(".inputAnswer").val();
    var noteValue = liEle.find(".inputNote").val();
    if (value || noteValue) {
      var outerIndex = getOuterIndex(liEle);
      answer.push({ position: outerIndex, value: value, noteValue: noteValue });
    }
  });
  return answer;
}

/*导入答案*/
function importAnswer(answerArr) {
  for (var i in answerArr) {
    var answer = answerArr[i];
    if (answer.value) {
      setInputValue(answer.position, answer.value);
    }
    if (answer.noteValue) {
      setNoteValue(answer.position, answer.noteValue);
    }
  }
}

/*绑定鼠标右键 自动计算可能值*/
function bindRightMouse() {
  $("li").bind("contextmenu", function () {
    return false;
  });

  $("li").mousedown(function (e) {
    if (3 == e.which) {
      //右键为3
      var liEle = $(this);
      autoCount(liEle);
    } else if (1 == e.which) {
      //左键为1
    }
  });
}

/**自动计算笔记 */
function autoCount(liEle) {
  if (!liEle) {
    $(".grid li:not(.subject)").each((i, ele) => {
      ele = $(ele);
      autoCount(ele);
    });
    return;
  }
  var inputEle = liEle.find(".inputAnswer");
  var numberArr = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  if (!inputEle.val()) {
    var outerIndex = getOuterIndex(liEle);
    var innerIndex = getInnerIndex(liEle);
    //   for (var i = 1; i <= 9; i++) {
    //     var index = i + "";
    //     var value;
    //     if (index != outerIndex[1]) {
    //       value = outerGrid[outerIndex[0]][index];
    //       deleteStr(numberArr, value);
    //     }
    //     if (index != outerIndex[0]) {
    //       value = outerGrid[index][outerIndex[1]];
    //       deleteStr(numberArr, value);
    //     }
    //     if (index != innerIndex[1]) {
    //       value = innerGrid[innerIndex[0]][index];
    //       deleteStr(numberArr, value);
    //     }
    //     // if (value) {
    //     // 	if ((numberIndex = numberArr.indexOf(value)) != -1) {
    //     // 		numberArr.splice(numberIndex, 1);
    //     // 	}
    //     // }
    //   }
    eachAboutGrid(outerIndex, innerIndex, (gridIndex, type) => {
      if (type) {
        var value = outerGrid[gridIndex[0]][gridIndex[1]];
        deleteStr(numberArr, value);
      } else {
        value = innerGrid[gridIndex[0]][gridIndex[1]];
        deleteStr(numberArr, value);
      }
    });
    setELENoteValue(liEle.find(".inputNote"), numberArr.toString());
  }
}

/**
 * 在已经计算好笔记的情况下根据笔记排除其他笔记可能值
 * 比如如果同一行只有两格格子有2,3 则表示这一行的其他格子不可能有2,3
 * 如果同一行只有三格格子有2,3,3 则表示其他的格子不可能有2,3,5
 * 只有当所有笔记计算正确时计算才有用
 */
function autoAdvancedNote() {
  eachGrid((item) => {
    autoAdvancedCountNote(item.outerIndexArrX, 1);
    autoAdvancedCountNote(item.outerIndexArrY, 1);
    autoAdvancedCountNote(item.innerIndexArr, 0);
  });
}

/**高级笔记的实际算法 */
function autoAdvancedCountNote(indexArr, type) {
  var liClass = ".";
  if (type) {
    liClass += "outer";
  } else {
    liClass += "inner";
  }
  //用于存放相同笔记值及其所在索引的位置数组 比如笔记值2,3 其在indexArr中下标2和5位置
  var noteValueMap = {};
  /*获取到所有有值得笔记 */
  indexArr.forEach((index, i) => {
    var ele = $(liClass + index);
    var noteValue = ele.find(".inputNote").val();
    if (noteValue) {
      //获取当前笔记值对应的数组
      var noteArr = noteValueMap[noteValue];
      if (!noteArr) {
        //如果不存在则创建
        noteArr = [];
        noteValueMap[noteValue] = noteArr;
      }
      //往当前笔记值对应的的数组里放入当前笔记的索引
      noteArr.push(i);
    }
  });

  for (var noteValue in noteValueMap) {
    //获取笔记值对于的下标数组
    var noteArr = noteValueMap[noteValue];
    //计算笔记长度,入"2,3"长度为2  "2,5,6"长度为3
    var noteValueLen = (noteValue.length + 1) / 2;
    if (noteValueLen != noteArr.length) {
      //如果当前笔记的长度比其出现的次数不一样,比如笔记"2,3"长度为2,但是其在noteArr中出现1次,则不予处理
      continue;
    }
    //如果当前笔记的长度比其出现的次数一样,则把其他位置的笔记和当前笔记一样的值删掉
    for (var i in indexArr) {
      if (noteArr.indexOf(Number(i)) == -1) {
        var ele = $(liClass + indexArr[i]);
        var noteEle = ele.find(".inputNote");
        //遍历当前笔记值,从其他笔记里面,删除当前所有的笔记值
        noteValue.split(",").forEach((noteValueItem) => {
          deleteNoteValue(noteEle, noteValueItem);
        });
      }
    }
  }
}

/**记得计算答案1：笔记只有唯一值得直接解答 */
function autoAnswer1() {
  $(".grid li:not(.subject)").each((i, ele) => {
    ele = $(ele);
    var noteValue = ele.find(".inputNote").val();
    if (noteValue.length == 1) {
      var answerEle = ele.find(".inputAnswer");
      answerEle.val(noteValue);
      inputValue(answerEle, true);
    }
  });
}

/**自动计算答案2：同一行 同一列 同一九宫格 只有一个格子的笔记含有某个值 直接解答 */
function autoAnswer2() {
  eachGrid((item) => {
    autoAnswerCount2(item.outerIndexArrX, 1);
    autoAnswerCount2(item.outerIndexArrY, 1);
    autoAnswerCount2(item.innerIndexArr, 0);
  });
}

/**
 * 根据同一行(列,九宫格)的索引找出只有一个笔记包含某个值进行解答的实际算法
 * @param {*} indexArr
 * @param {*} type 0=内部小九宫格 1=外部格子
 */
function autoAnswerCount2(indexArr, type) {
  var liClass = ".";
  if (type) {
    liClass += "outer";
  } else {
    liClass += "inner";
  }
  var noteArr = [];
  /*获取到所有有值得笔记 */
  indexArr.forEach((index) => {
    var ele = $(liClass + index);
    var noteValue = ele.find(".inputNote").val();
    if (noteValue) {
      noteArr.push({ noteValue: noteValue + ",", ele: ele });
    }
  });

  for (var i = 1; i <= 9; i++) {
    var ele = null;
    noteArr.some((item) => {
      /*当前笔记是否包含i,比如i=1 */
      if (item.noteValue.indexOf(i) != -1) {
        if (!ele) {
          //如果包含i且ele为null则设置ele=当前笔记对于的ele
          ele = item.ele;
        } else {
          //如果ele不为null表示已经有其他笔记包含i了,那么久把当前ele设为null且跳出本次循环
          ele = null;
          return true;
        }
      }
    });
    //如果ele不为null 表示笔记中存在唯一一个包含当前i的,否则表示不存在或者存在至少2个包含当前i的
    if (ele) {
      var answerEle = ele.find(".inputAnswer");
      answerEle.val(i);
      inputValue(answerEle, true);
    }
  }
}

/**摒除法  */
function autoAnswer3(type) {
  for (var i = 1; i <= 9; i++) {
    //每一行包含i的格子li,{"1":[li1,li2]，"2":[li1,li2]}
    var outerXArr = [];
    //每一列包含i的格子li ,{"1":[li1,li2]，"2":[li1,li2]}
    var outerYArr = [];
    eachGrid((item) => {
      item.outerIndexArrX.forEach((index) => {
        var liClass = ".outer";
        var ele = $(liClass + index);
        var noteValue = ele.find(".inputNote").val();
        if (noteValue) {
          if (noteValue.indexOf(i) != -1) {
            //当前行包含i的列 liEle数组
            var containXArr = outerXArr[index[0]];
            //当前列包含i的列 liEle数组
            var containYArr = outerYArr[index[1]];
            if (!containXArr) {
              containXArr = [];
              outerXArr[index[0]] = containXArr;
            }
            if (!containYArr) {
              containYArr = [];
              outerYArr[index[1]] = containYArr;
            }
            containXArr.push(ele);
            containYArr.push(ele);
          }
        }
      });
    });
    if ("qukuai" == type) {
      autoAnswerCount3(outerXArr, i);
      autoAnswerCount3(outerYArr, i);
    } else if ("zuhe" == type) {
      autoAnswerCountZuhe(outerXArr, i, true);
      autoAnswerCountZuhe(outerYArr, i, false);
    } else if ("juxing" == type) {
      autoAnswerCountJuxing(outerXArr, i, true);
      autoAnswerCountJuxing(outerYArr, i, false);
    }
  }
  /**
   * 矩形摒除法
   * http://www.llang.net/sudoku/skill/1-6.html
   * 根据每行计算出可能有n的格子,本行有n的格子只能有2个
   * 比对上面记录的可能为n的格子是否存在4个格子位置能构成矩形(每个格子和另外两个格子要么同行要么同列)
   * 如果存在这样的格子表示n值只能存在于这四个格子中,去掉这格子同列中有n的笔记
   * 根据行计算同理
   * @param {*} outerArr
   * @param {*} value
   * @param {*} isX 是否行
   */
  function autoAnswerCountJuxing(outerArr, value, isX) {
    //只有一行有值形成不了矩形
    if (outerArr == 1) {
      return;
    }
    //下面以isX 为行为例,列相反
    //用于放行大于两个有n值的列index数组
    var countArr = {};
    //用于放列有n值的行index数组
    var otherArr = {};
    /**用于存放每个格子位置数组 */
    var positionArr = [];
    for (var xIndex in outerArr) {
      //只有行内有值且只有两列才能在当成行内二选一,如此形成的矩形才能进行摒除
      var liArr = outerArr[xIndex];
      if (liArr.length == 2) {
        for (var i in liArr) {
          var ele = liArr[i];
          var otherIndex;
          if (isX) {
            //行则取列index
            otherIndex = getOuterIndex(ele)[1];
          } else {
            //列取行index
            otherIndex = getOuterIndex(ele)[0];
          }
          //每一行中所有的列index数组push
          var tempArr = countArr[xIndex];
          if (!tempArr) {
            tempArr = [];
            countArr[xIndex] = tempArr;
          }
          tempArr.push(otherIndex);

          //每一列中所有行的index数组push
          tempArr = otherArr[otherIndex];
          if (!tempArr) {
            tempArr = [];
            otherArr[otherIndex] = tempArr;
          }
          tempArr.push(xIndex);

          //push格子位置
          positionArr.push(xIndex + otherIndex);
        }
      }
    }

    for (var index in countArr) {
      //当前格子所在行的其他列索引
      var otherIndexArr = countArr[index];
      for (var i in otherIndexArr) {
        //有行有列表示一个格子,此处index+otherIndex 表示第一个格子
        var otherIndex = otherIndexArr[i];
        //第一个格子所在列的其他行索引
        var countIndexArr = otherArr[otherIndex];
        for (var j in countIndexArr) {
          var countIndex = countIndexArr[j];
          //和第一个格子同列,如果和第一个格子在同一行就是同一个格子,不予考虑
          if (countIndex != index) {
            //如果是和第一个格子不是同一行则countIndex+otherIndex表示第二个格子
            //拿到第二个格子同行的其他列的索引
            var oterhIndexArr2 = countArr[countIndex];
            for (var z in oterhIndexArr2) {
              var otherIndex2 = oterhIndexArr2[z];
              //和第二个格子同行,如果和第二个格子在同一列则表示同一个格子,不予考虑
              if (otherIndex2 != otherIndex) {
                //如果和第二个格子不是同一列则countIndex+otherIndex2表示第三个格子
                //此时index+otherIndex2为第四个格子
                //此时如果存在第四个格子index+otherIndex2则四个格子可以构成矩形
                if (positionArr.indexOf(index + otherIndex2) != -1) {
                  //去掉四个格子同列的其他n值笔记
                  var indexArr = [otherIndex, otherIndex2];
                  //如果是行 index 是行 otherIndex是列,否则index是列otherIndex是行,格式位置是行+列
                  var outerIndexArr = [
                    index + otherIndex,
                    countIndex + otherIndex,
                    countIndex + otherIndex2,
                    index + otherIndex2,
                  ];
                  //如果不是行的话之前的索引是列+行,所以需要颠倒
                  if (!isX) {
                    var temp = [];
                    outerIndexArr.forEach((item) => {
                      temp.push(item[1] + item[0]);
                    });
                    outerIndexArr = temp;
                  }
                  autoAnswerCountJuxingDelete(
                    indexArr,
                    outerIndexArr,
                    value,
                    !isX
                  );
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * 矩形摒除法删除笔记逻辑
   * @param indexArr 要删除哪些行(列)里的其他格子的笔记 [1,3]
   * @param outerIndexArr 不能删笔记的格子的位置['11,'12','32']
   * @param value 要删除的笔记的值
   * @param isX 清除的是否是行
   */
  function autoAnswerCountJuxingDelete(indexArr, outerIndexArr, value, isX) {
    // for (var index in indexArr) {
    //   for (var i = 1; i <= 9; i++) {
    //     var outerIndex;
    //     if (isX) {
    //       //true 则index为行
    //       outerIndex = indexArr[index] + i;
    //     } else {
    //       //否则为列
    //       outerIndex = i + indexArr[index];
    //     }
    //     if (outerIndexArr.indexOf(outerIndex) == -1) {
    //       var noteEle = $(".outer" + outerIndex).find(".inputNote");
    //       deleteNoteValue(noteEle, value);
    //     }
    //   }
    // }
    autoAnswerCountZuheDelete(indexArr, outerIndexArr, value, isX);
  }

  /**
   * 组合摒除法
   * 第[1,2,3],[4,5,6],[7,8,9]内部九宫格为一组
   * 根据列识别出可能有n值的值仅存在于[1,2,3]内部九宫格内
   * 比较[1,2,3]内部九宫格 有n值得行是否一样
   * 如第1个内部九宫个1,2行有n值, 第2个1,2,3行有n值,第3个1,2行有n值
   * 第1个1,2行=第3个1,2行,那么表示n值只能存在于1,2行的第1,3个内部九宫格里,此时1,2行不是第1,3个内部九宫格的格子不可能有n值,即第二个内部九宫格的1,2行不能有n值
   * @param {*} outerArr
   * @param {*} value
   * @param {*} isX 是否行
   */
  function autoAnswerCountZuhe(outerArr, value, isX) {
    //用于摒除计算的数组,包含了1-3,4-6,7-9的格子情况，{"1-3行":innerContainOuterX,”4-6行":innerContainOuterX}
    var countArr = {};
    for (var xIndex in outerArr) {
      var containArr = outerArr[xIndex];
      //innerContainOuterX 包含1-3，4-6-9的内部九宫格的情况 {"1-3内部九宫格":indexObj,”4-6内部九宫格":indexObj}
      var areaIndex = Math.ceil(Number(xIndex) / 3);
      var innerContainOuterX = countArr[areaIndex];
      if (!innerContainOuterX) {
        innerContainOuterX = {};
        countArr[areaIndex] = innerContainOuterX;
      }
      for (var containIndex in containArr) {
        var containArr = outerArr[xIndex];
        var liEle = containArr[containIndex];
        var outerIndex = getOuterIndex(liEle);
        var innerIndex = getInnerIndex(liEle);

        var indexObj = innerContainOuterX[innerIndex[0]];
        if (!indexObj) {
          //indexObj 包含了如第一个内部九宫格里的情况 { indexArr: [当前内部九宫格对应哪几行有值], outerIndexArr: [当前内部九宫格有值的全部格子] }
          indexObj = { indexArr: [], outerIndexArr: [] };
          innerContainOuterX[innerIndex[0]] = indexObj;
        }
        var indexArr = indexObj.indexArr;
        if (indexArr.indexOf(xIndex) == -1) {
          indexArr.push(xIndex);
        }
        indexObj.outerIndexArr.push(outerIndex);
      }
    }
    for (var index in countArr) {
      var innerContainOuterX = countArr[index];
      var innerContainOuterXArr = [];
      for (var innerIndex in innerContainOuterX) {
        var indexObj = innerContainOuterX[innerIndex];
        innerContainOuterXArr.push(indexObj);
      }
      if (innerContainOuterXArr.length > 1) {
        for (var i = 0; i < innerContainOuterXArr.length; i++) {
          if (innerContainOuterXArr[i].indexArr.length != 2) {
            continue;
          }
          for (var j = i + 1; j < innerContainOuterXArr.length; j++) {
            if (
              innerContainOuterXArr[i].indexArr.equals(
                innerContainOuterXArr[j].indexArr
              )
            ) {
              var outerIndexArr = innerContainOuterXArr[i].outerIndexArr.concat(
                innerContainOuterXArr[j].outerIndexArr
              );
              autoAnswerCountZuheDelete(
                innerContainOuterXArr[i].indexArr,
                outerIndexArr,
                value,
                isX
              );
            }
          }
        }
      }
    }
  }

  /**
   * 组合摒除法删除笔记逻辑
   * @param indexArr 要删除哪些行(列)里的其他格子的笔记 [1,3]
   * @param outerIndexArr 不能删笔记的格子的位置['11,'12','32']
   * @param value 要删除的笔记的值
   * @param isX 清除的是否是行
   */
  function autoAnswerCountZuheDelete(indexArr, outerIndexArr, value, isX) {
    for (var index in indexArr) {
      for (var i = 1; i <= 9; i++) {
        var outerIndex;
        if (isX) {
          //true 则index为行
          outerIndex = indexArr[index] + i;
        } else {
          //否则为列
          outerIndex = i + indexArr[index];
        }
        if (outerIndexArr.indexOf(outerIndex) == -1) {
          var noteEle = $(".outer" + outerIndex).find(".inputNote");
          deleteNoteValue(noteEle, value);
        }
      }
    }
  }

  /**
   * 区块摒除法 ，同一行(列)包含某数值如5的格子全在一个内部九宫格里,因为此时这行(列)包含5的格子必须有一个是n,所以内部九宫格的其他行(列)格子就不能有5
   * @param {"第几行":["liEle"]}} outerArr 所有包含 value的行或者所有包含value的列
   * @param {*} value 当前检查的值 1-9
   */
  function autoAnswerCount3(outerArr, value) {
    for (var xIndex in outerArr) {
      var containArr = outerArr[xIndex];
      //包含i的格子内部九宫格索引的数组
      var cotainInnerIndexArr = [];
      /* 包含i的格子是第几个内部九宫格,需要所有格子都在同一个内部九宫格才能摒除 */
      var inner1;
      for (var containIndex in containArr) {
        var liEle = containArr[containIndex];
        var innerIndex = getInnerIndex(liEle);
        cotainInnerIndexArr.push(innerIndex);

        if (!inner1) {
          //如果是第一次循环,则让inner1=当前格子的内部九宫格的位置
          inner1 = innerIndex[0];
        } else if (innerIndex[0] != inner1) {
          //如果后面的格子不在同一个内部九宫格,则无法进行摒除直接跳过当前行
          inner1 = null;
          break;
        }
      }
      //如果inner1不为空表示全在同一个位置 摒除当前内部九宫格其他位置笔记里的i
      if (inner1) {
        for (var i = 1; i <= 9; i++) {
          var innerIndex = inner1 + i;
          if (cotainInnerIndexArr.indexOf(innerIndex) == -1) {
            var noteEle = $(".inner" + innerIndex).find(".inputNote");
            deleteNoteValue(noteEle, value);
          }
        }
      }
    }
  }
}

/**
 * 遍历当前格子所有相关的格子执行回调函数
 * @param outerIndex
 * @param innerIndex
 * @param callback回调函数-传入 index:当前相关格子的位置 type:0=内部小九宫格 1=外部格子
 * 横 竖 内部九宫格相关的个8个,所以总共回调3*8次
 */
function eachAboutGrid(outerIndex, innerIndex, callback) {
  for (var i = 1; i <= 9; i++) {
    var index = i + "";
    if (index != outerIndex[1]) {
      callback(outerIndex[0] + index, 1);
    }
    if (index != outerIndex[0]) {
      callback(index + outerIndex[1], 1);
    }
    if (index != innerIndex[1]) {
      callback(innerIndex[0] + index, 0);
    }
  }
}

/**
 * 获取 同行,同列,同内部九宫格的格子index集合执行回调函数
 * @param callback回调函数-传入 {outerIndexArrX:"同一行的格子index 9个",outerIndexArrY:"同一列的格子index 9个",innerIndexArr:"同一内部九宫格的格子index 9个"}
 * 9行 9列 9个内部九宫格 1行1列一九宫格为一组回调一次所以回调9次
 */
function eachGrid(callback) {
  for (var i = 1; i <= 9; i++) {
    /** 同一行九宫格的索引集合 */
    var outerIndexArrX = [];
    /** 同一列九宫格的索引集合 */
    var outerIndexArrY = [];
    /** 同一内部九宫格九宫格的索引集合 */
    var innerIndexArr = [];
    for (var j = 1; j <= 9; j++) {
      outerIndexArrX.push(i + "" + j);
      outerIndexArrY.push(j + "" + i);
      innerIndexArr.push(i + "" + j);
    }
    callback({
      outerIndexArrX: outerIndexArrX,
      outerIndexArrY: outerIndexArrY,
      innerIndexArr: innerIndexArr,
    });
  }
}
/**
 * 遍历当前格子所有相关的格子执行回调函数
 * @param outerIndex
 * @param innerIndex
 * @param callback回调函数-传入 index:当前格子的位置 type:0=内部小九宫格 1=外部格子
 * 循环九次,包含同行 同列 同一小九宫格的格子
 */
function eachEleAboutGrid(ele, callback) {
  var outerIndex = getOuterIndex(ele);
  var innerIndex = getInnerIndex(ele);
  eachAboutGrid(outerIndex, innerIndex, callback);
}

/*outer11 去掉outer 返回11*/
function getOuterIndex(ele) {
  var classNames = ele.prop("class").split(" ");
  for (var index in classNames) {
    var className = classNames[index];
    if (className.indexOf("outer") != -1) {
      return className.split("outer")[1];
    }
  }
}
/*inner11 去掉inner 返回11*/
function getInnerIndex(ele) {
  var classNames = ele.prop("class").split(" ");
  for (var index in classNames) {
    var className = classNames[index];
    if (className.indexOf("inner") != -1) {
      return className.split("inner")[1];
    }
  }
}

/**
 * 往grid中添加格子值
 * @param grid outerGrid或者 innerGrid
 * @param position 格子的位置如 21=第二行第一列
 * @param 格子的值
 */
function addGrid(grid, position, value) {
  grid[position[0]][position[1]] = value;
}

//删除数组中的数字
function deleteStr(numberArr, value) {
  if (value) {
    if ((numberIndex = numberArr.indexOf(value)) != -1) {
      numberArr.splice(numberIndex, 1);
    }
  }
}

Date.prototype.format = function (fmt) {
  var o = {
    "M+": this.getMonth() + 1, //月份
    "d+": this.getDate(), //日
    "h+": this.getHours(), //小时
    "m+": this.getMinutes(), //分
    "s+": this.getSeconds(), //秒
    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
};

// Warn if overriding existing method
if (Array.prototype.equals)
  console.warn(
    "Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code."
  );
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
  // if the other array is a falsy value, return
  if (!array) return false;

  // compare lengths - can save a lot of time
  if (this.length != array.length) return false;

  for (var i = 0, l = this.length; i < l; i++) {
    // Check if we have nested arrays
    if (this[i] instanceof Array && array[i] instanceof Array) {
      // recurse into the nested arrays
      if (!this[i].equals(array[i])) return false;
    } else if (this[i] != array[i]) {
      // Warning - two different object instances will never be equal: {x:20} != {x:20}
      return false;
    }
  }
  return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

var YYYY_MM_DD_HH_MM_SS = "yyyy-MM-dd hh:mm:ss";

var subjectList = [];
subjectList.push([
  { position: "13", value: "7" },
  { position: "21", value: "6" },
  { position: "31", value: "9" },
  { position: "32", value: "1" },
  { position: "15", value: "3" },
  { position: "26", value: "9" },
  { position: "35", value: "4" },
  { position: "36", value: "2" },
  { position: "19", value: "9" },
  { position: "27", value: "8" },
  { position: "37", value: "3" },
  { position: "39", value: "7" },
  { position: "41", value: "1" },
  { position: "51", value: "2" },
  { position: "61", value: "7" },
  { position: "63", value: "8" },
  { position: "44", value: "3" },
  { position: "45", value: "8" },
  { position: "54", value: "9" },
  { position: "65", value: "6" },
  { position: "47", value: "9" },
  { position: "49", value: "4" },
  { position: "59", value: "6" },
  { position: "69", value: "1" },
  { position: "71", value: "3" },
  { position: "73", value: "1" },
  { position: "83", value: "4" },
  { position: "91", value: "5" },
  { position: "74", value: "5" },
  { position: "75", value: "7" },
  { position: "84", value: "1" },
  { position: "95", value: "2" },
  { position: "78", value: "9" },
  { position: "79", value: "8" },
  { position: "89", value: "2" },
  { position: "97", value: "1" },
]);
subjectList.push([
  { position: "12", value: "2" },
  { position: "21", value: "8" },
  { position: "31", value: "1" },
  { position: "16", value: "7" },
  { position: "24", value: "1" },
  { position: "34", value: "5" },
  { position: "35", value: "2" },
  { position: "19", value: "4" },
  { position: "28", value: "5" },
  { position: "38", value: "9" },
  { position: "43", value: "1" },
  { position: "52", value: "6" },
  { position: "53", value: "8" },
  { position: "63", value: "5" },
  { position: "46", value: "3" },
  { position: "65", value: "6" },
  { position: "47", value: "2" },
  { position: "57", value: "3" },
  { position: "58", value: "1" },
  { position: "67", value: "7" },
  { position: "72", value: "8" },
  { position: "82", value: "1" },
  { position: "91", value: "6" },
  { position: "75", value: "9" },
  { position: "76", value: "5" },
  { position: "86", value: "8" },
  { position: "94", value: "4" },
  { position: "79", value: "1" },
  { position: "89", value: "3" },
  { position: "98", value: "7" },
]);
subjectList.push([
  { position: "13", value: "1" },
  { position: "22", value: "9" },
  { position: "16", value: "7" },
  { position: "26", value: "6" },
  { position: "36", value: "4" },
  { position: "18", value: "3" },
  { position: "29", value: "1" },
  { position: "38", value: "6" },
  { position: "41", value: "5" },
  { position: "51", value: "1" },
  { position: "63", value: "2" },
  { position: "44", value: "3" },
  { position: "54", value: "9" },
  { position: "55", value: "8" },
  { position: "65", value: "7" },
  { position: "47", value: "6" },
  { position: "59", value: "4" },
  { position: "69", value: "9" },
  { position: "72", value: "7" },
  { position: "81", value: "8" },
  { position: "92", value: "3" },
  { position: "74", value: "5" },
  { position: "84", value: "7" },
  { position: "94", value: "4" },
  { position: "88", value: "9" },
  { position: "97", value: "2" },
]);
subjectList.push([{"position":"13","value":"1"},{"position":"22","value":"8"},{"position":"23","value":"4"},{"position":"31","value":"2"},{"position":"15","value":"3"},{"position":"16","value":"2"},{"position":"36","value":"8"},{"position":"28","value":"3"},{"position":"38","value":"9"},{"position":"42","value":"2"},{"position":"61","value":"7"},{"position":"63","value":"3"},{"position":"44","value":"7"},{"position":"54","value":"1"},{"position":"56","value":"3"},{"position":"66","value":"9"},{"position":"47","value":"3"},{"position":"49","value":"4"},{"position":"68","value":"6"},{"position":"72","value":"6"},{"position":"82","value":"9"},{"position":"74","value":"3"},{"position":"94","value":"9"},{"position":"95","value":"6"},{"position":"79","value":"9"},{"position":"87","value":"1"},{"position":"88","value":"7"},{"position":"97","value":"4"}]);
//区块摒除
subjectList.push([
  { position: "11", value: "6" },
  { position: "21", value: "5" },
  { position: "22", value: "3" },
  { position: "23", value: "7" },
  { position: "31", value: "1" },
  { position: "32", value: "4" },
  { position: "33", value: "8" },
  { position: "14", value: "1" },
  { position: "15", value: "7" },
  { position: "16", value: "5" },
  { position: "24", value: "4" },
  { position: "36", value: "3" },
  { position: "28", value: "9" },
  { position: "29", value: "1" },
  { position: "38", value: "7" },
  { position: "39", value: "5" },
  { position: "41", value: "7" },
  { position: "43", value: "6" },
  { position: "52", value: "1" },
  { position: "53", value: "4" },
  { position: "63", value: "3" },
  { position: "45", value: "3" },
  { position: "54", value: "7" },
  { position: "55", value: "5" },
  { position: "65", value: "1" },
  { position: "47", value: "1" },
  { position: "59", value: "6" },
  { position: "67", value: "7" },
  { position: "69", value: "9" },
  { position: "71", value: "4" },
  { position: "73", value: "5" },
  { position: "82", value: "7" },
  { position: "91", value: "3" },
  { position: "93", value: "1" },
  { position: "74", value: "3" },
  { position: "76", value: "7" },
  { position: "84", value: "5" },
  { position: "86", value: "1" },
  { position: "96", value: "2" },
  { position: "77", value: "9" },
  { position: "78", value: "1" },
  { position: "79", value: "2" },
  { position: "87", value: "4" },
  { position: "88", value: "6" },
  { position: "89", value: "3" },
  { position: "97", value: "5" },
  { position: "98", value: "8" },
  { position: "99", value: "7" },
]);

//矩形摒除
subjectList.push([
  { position: "13", value: "6" },
  { position: "21", value: "1" },
  { position: "22", value: "8" },
  { position: "23", value: "4" },
  { position: "31", value: "5" },
  { position: "14", value: "4" },
  { position: "16", value: "9" },
  { position: "24", value: "2" },
  { position: "34", value: "3" },
  { position: "35", value: "6" },
  { position: "19", value: "5" },
  { position: "27", value: "9" },
  { position: "28", value: "6" },
  { position: "29", value: "3" },
  { position: "37", value: "4" },
  { position: "43", value: "3" },
  { position: "51", value: "7" },
  { position: "53", value: "8" },
  { position: "61", value: "4" },
  { position: "46", value: "4" },
  { position: "64", value: "8" },
  { position: "49", value: "9" },
  { position: "57", value: "3" },
  { position: "58", value: "4" },
  { position: "59", value: "2" },
  { position: "67", value: "5" },
  { position: "81", value: "9" },
  { position: "83", value: "5" },
  { position: "92", value: "4" },
  { position: "74", value: "9" },
  { position: "75", value: "4" },
  { position: "76", value: "6" },
  { position: "86", value: "2" },
  { position: "94", value: "5" },
  { position: "78", value: "5" },
  { position: "79", value: "1" },
  { position: "88", value: "3" },
  { position: "89", value: "4" },
  { position: "97", value: "2" },
  { position: "98", value: "9" },
]);
//矩形摒除
subjectList.push(
[{"position":"32","value":"7"},{"position":"25","value":"6"},{"position":"26","value":"1"},{"position":"17","value":"3"},{"position":"19","value":"4"},{"position":"27","value":"5"},{"position":"37","value":"6"},{"position":"39","value":"9"},{"position":"41","value":"8"},{"position":"53","value":"1"},{"position":"44","value":"4"},{"position":"45","value":"9"},{"position":"55","value":"7"},{"position":"65","value":"1"},{"position":"66","value":"6"},{"position":"57","value":"9"},{"position":"69","value":"8"},{"position":"71","value":"4"},{"position":"73","value":"5"},{"position":"83","value":"2"},{"position":"91","value":"1"},{"position":"93","value":"9"},{"position":"84","value":"5"},{"position":"85","value":"4"},{"position":"78","value":"6"}]);

function initSubjectList() {
  var liHtml = "";
  subjectList.forEach((item, i) => {
    liHtml +=
      '<li><button onclick="selectSubject(' +
      i +
      ')">题目' +
      (i + 1) +
      "</button></li>";
  });
  $("#buttonSubject").html(liHtml);
}

function selectSubject(index) {
  importSubject(subjectList[index]);
}
