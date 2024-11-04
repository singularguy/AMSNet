import React, { useState, useRef, useEffect } from 'react';

import './FileOperate.css';
import { saveUsingPost } from "@/services/backend/fileController";
import {Popover} from "antd";

const FileOperate: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [userText, setUserText] = useState<string>('示例文字'); // 默认文字
  const [textColor, setTextColor] = useState<string>('black'); // 默认文字颜色
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [drawnRectangles, setDrawnRectangles] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }[]>([]);
  // 设置默认 jsoninput为json格式的一个字符串
  // @ts-ignore
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({ "shapes": [] }, null, 2));
  const [inputWidth, setInputWidth] = useState<number>(280);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const shapeColorMap = {
    'port': '#007FFF',
    'resistor': '#00FF00',
    'capacitor': '#FFA500',
    'current': '#800080',
    'voltage': '#FF0000',
    'nmos': '#FFFF00',
  };
  const tagColorMap = {
    'tag1': '#FF0000',
    'tag2': '#00FF00',
    'tag3': '#0000FF',
  };
  const [selectedRectangles, setSelectedRectangles] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectButtonHighlighted, setSelectButtonHighlighted] = useState(false);
  const [highlightedRectangle, setHighlightedRectangle] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [stainedRectangles, setStainedRectangles] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }[]>([]);
  const [textboxPairs, setTextboxPairs] = useState<{ id: number; leftInput: string; rightInput: string }[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedShape, setSelectedShape] = useState<string>('rectangle'); // 默认形状为矩形
  const [selectedColorForShape, setSelectedColorForShape] = useState<string>('black');
  const [newCategoryButtonColor, setNewCategoryButtonColor] = useState<string>('#007FFF');
  const [newTagButtonColor, setNewTagButtonColor] = useState<string>('#FF0000');
  const [rectangleNumbers, setRectangleNumbers] = useState<number[]>([]);
  const [isEnglish, setIsEnglish] = useState(false); // 默认为中文
  const [labelColorMapState, setLabelColorMapState] = useState(shapeColorMap);
  const [tagColorMapState, setTagColorMapState] = useState(tagColorMap);
  const [isDrawingDisabled, setIsDrawingDisabled] = useState(false);
  const [selectedRectangleIndex, setSelectedRectangleIndex] = useState<number | null>(null);
  const [tagRectangleRelations, setTagRectangleRelations] = useState<{ rectangleIndex: number; tag: string }[]>([]);

  const isPointInRectangle = (x: number, y: number, rect: { x: number; y: number; width: number; height: number }) => {
    const leftX = Number(rect.x);
    const topY = Number(rect.y);
    const width = Number(rect.width);
    const height = Number(rect.height);
    return x >= leftX && x <= leftX + width && y >= topY && y <= topY + height;
  };
  const handleSelectButtonClick = () => {
    setSelectButtonHighlighted(!selectButtonHighlighted);
    setIsDrawingDisabled(!isDrawingDisabled);
  };

  const chineseButtonTexts = {
    title: 'AMSNet',
    subTitle: '欢迎使用 AMSNet 图像处理工具',
    fileUpload: '选择文件',
    saveButton: '保存图片',
    deleteButton: '删除图片',
    undoButton: '撤回',
    clearButton: '清除',
    saveToLocalButton: '保存到本地',
    parseJsonButton: '解析JSON',
    selectColorButton: '类别',
    addCategoryButton: '增加类别',
    removeCategoryButton: '删除类别',
    selectRectangleButton: '选择框',
    selectTagButton: '填充',
    undoStain: '撤销染色',
    clearStain: '清除染色',
    addTagButton: '增加标签',
    removeTagButton: '删除标签',
    addTextboxPair: '添加文本框',
    removeTextboxPair: '删除文本框',
    EN_CN_button: '中文',
  };
  const englishButtonTexts = {
    title: 'AMSNet',
    subTitle: 'Welcome to AMSNet Image Processing Tool',
    fileUpload: 'Select File',
    saveButton: 'Save',
    deleteButton: 'Delete',
    undoButton: 'Undo',
    clearButton: 'Clear',
    saveToLocalButton: 'Save',
    parseJsonButton: 'Parse',
    selectColorButton: 'Class',
    addCategoryButton: 'Add',
    removeCategoryButton: 'Delete',
    selectRectangleButton: 'Select Box',
    selectTagButton: 'Fill',
    undoStain: 'Undo Tag',
    clearStain: 'Clear Tag',
    addTagButton: 'Add',
    removeTagButton: 'Delete',
    addTextboxPair: 'Add',
    removeTextboxPair: 'Delete',
    EN_CN_button: 'English',
  };
  // 定义函数来切换文本
  const toggleButtonTexts = () => {
    setIsEnglish(!isEnglish);
  };
  // 函数来获取当前语言下的按钮文本
  const getButtonText = (buttonName: string) => {
    return isEnglish? englishButtonTexts[buttonName] : chineseButtonTexts[buttonName];
  };
  const handleNewCategoryButtonClick = (color: string) => {
    setNewCategoryButtonColor(color);
  };

  const handleNewTagButtonClick = (color: string) => {
    setNewTagButtonColor(color);
    // console.log('newTagButtonColor', newTagButtonColor);
    // 根据颜色获取标签名称
    const tagName = Object.keys(tagColorMap).find(key => tagColorMap[key as keyof typeof tagColorMap] === color);
    setTagInput(tagName);
    console.log('tagInput', tagInput);
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
    if (dropdownVisible) {
      document.body.removeEventListener('click', handleBodyClick);
    } else {
      document.body.addEventListener('click', handleBodyClick);
    }
  };
  const handleBodyClick = (event) => {
    if (!event.target.classList.contains('draw-custom-shape-button') && dropdownVisible) {
      setDropdownVisible(false);
      document.body.removeEventListener('click', handleBodyClick);
    }
  };
  const addTextboxPair = () => {
    const newId = Date.now();
    setTextboxPairs([...textboxPairs, { id: newId, leftInput: '', rightInput: '' }]);
  };
  const deleteTextboxPair = (id: number) => {
    setTextboxPairs(textboxPairs.filter(pair => pair.id!== id));
  };
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // 检查是否点击在某个矩形内
      const rectangles = drawnRectangles;
      // console.log('rectangles---------', rectangles);
      for (let i = 0; i < rectangles.length; i++) {
        const rect = rectangles[i];
        if (isPointInRectangle(mouseX, mouseY, rect)) {
          setSelectedRectangleIndex(i);
          // 分配唯一编号
          if (!rectangleNumbers[i]) {
            setRectangleNumbers(prevNumbers => {
              const newNumbers = [...prevNumbers];
              newNumbers[i] = newNumbers.length + 1;
              return newNumbers;
            });
          }
          break;
        } else {
          setSelectedRectangleIndex(null);
        }
      }

      setStartX(event.clientX - rect.left);
      setStartY(event.clientY - rect.top);
      if (isSelecting) {
        startSelecting(event);
      } else if (highlightedRectangle === null) {
        checkIfInRectangle(event.clientX - rect.left, event.clientY - rect.top);
      }
      // 处理选择框按钮点击
      if (event.target.classList.contains('select-button')) {
        setSelectButtonHighlighted(!selectButtonHighlighted);
      }
    }
  };
  const checkIfInRectangle = (x: number, y: number) => {
    const rectangles = drawnRectangles;
    for (let i = 0; i < rectangles.length; i++) {
      const rect = rectangles[i];
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        setHighlightedRectangle(rect);
        return;
      }
    }
    setHighlightedRectangle(null);
  };

  const startSelecting = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      setSelectedRectangles(
        drawnRectangles.filter((rect) =>
          isPointInRectangle(mouseX, mouseY, rect)
        )
      );
    }
  };
  // 保存到本地
  const handleSaveImageToLocal = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert('没有可保存的图片。');
    }
  };
  // 处理文件变化事件的函数
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file));
      const fileName = file.name;
      // 更新 JSON 数据中的 imagePath
      try {
        const currentJson = JSON.parse(jsonInput);
        currentJson.imagePath = fileName;
        setJsonInput(JSON.stringify(currentJson));
      } catch (error) {
        console.error('Invalid JSON input:', jsonInput);
      }
    } else {
      alert('请选择有效的文件。');
    }
  };


  const formatJsonForDisplay = (jsonString) => {
    // 打印输入的 JSON 字符串用于调试
    console.log("input" + jsonString);
    try {
      // 解析输入的 JSON 字符串为一个对象
      const jsonData = JSON.parse(jsonString);
      // 如果对象中没有 shapes 属性，将其初始化为一个空数组
      if (!jsonData.shapes) {
        jsonData.shapes = [];
      }
      // 创建一个新的对象，包含默认的 version、flags 等属性以及原始对象的其他属性
      const newJsonData = {
        "version": "Default Version",
        "flags": {},
        ...jsonData,
        "imagePath": jsonData.imagePath,
        "imageData": null,
        "imageHeight": jsonData.imageHeight,
        "imageWidth": jsonData.imageWidth
      };
      // 初始化格式化后的 JSON 字符串
      let formattedJson = '{\n';
      formattedJson += `  "version": "${newJsonData.version}",\n`;
      formattedJson += `  "flags": ${JSON.stringify(newJsonData.flags)},\n`;
      formattedJson += '  "shapes": [';
      newJsonData.shapes.forEach((shape, index) => {
        formattedJson += '\n    {';
        for (const key in shape) {
          // 如果键不是 label、points、group_id、shape_type 或 flags，则跳过当前循环
          if (!['label', 'points', 'group_id', 'shape_type', 'flags'].includes(key)) continue;
          if (key === 'points') {
            // 对 points 进行处理，将其格式化为易于阅读的形式
            let pointsValue = JSON.stringify(shape[key]).replace(/\[\[/, '[\n    [');
            pointsValue = pointsValue.replace(/\]\]/, ']\n    ]');
            pointsValue = pointsValue.replace(/\],\[/g, '],\n    [');
            // 处理 points 中的数字保留一位小数并转换为字符串
            // 使用正则表达式匹配所有的数字，包括带小数的数字
            pointsValue = pointsValue.replace(/(-?\d+(?:\.\d+)?)/g, (match, num) => {
              const n = parseFloat(num);
              // 如果数字是整数，则在后面添加 '.0'，否则保留一位小数
              return n % 1 === 0? n + '.0' : n.toFixed(1);
            });
            // 将 points 的值格式化为数组的形式，并添加到格式化后的 JSON 字符串中
            formattedJson += `\n      "${key}": [\n    ${pointsValue.replace(/:/g, ',')}\n    ],`;
          } else {
            let value = shape[key];
            if (typeof value === 'number') {
              // 如果值是数字，根据是否为整数进行格式化，并添加到格式化后的 JSON 字符串中
              const formattedValue = value % 1 === 0? value + '.0' : value.toFixed(1);
              formattedJson += `\n      "${key}": ${JSON.stringify(formattedValue)},`;
            } else {
              // 如果值不是数字，直接将其转换为字符串并添加到格式化后的 JSON 字符串中
              formattedJson += `\n      "${key}": ${JSON.stringify(value)},`;
            }
          }
        }
        // 去除最后一个多余的逗号，并添加结束括号和换行
        formattedJson = formattedJson.slice(0, -1) + '\n    }';
        // 如果不是最后一个形状，添加逗号和换行
        if (index < newJsonData.shapes.length - 1) {
          formattedJson += ',';
        }
      });
      formattedJson += '\n  ]';
      formattedJson += `,\n  "imagePath": "${newJsonData.imagePath}",\n  "imageData": ${newJsonData.imageData},\n  "imageHeight": ${newJsonData.imageHeight},\n  "imageWidth": ${newJsonData.imageWidth}\n}`;
      // 返回格式化后的 JSON 字符串
      return formattedJson;
    } catch (error) {
      // 如果出现错误，返回原始的 JSON 字符串
      return jsonString;
    }
  };
  // 处理删除图像的函数
  const handleDeleteImage = () => {
    setSelectedFile(null);
    setImageUrl('');
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setDrawnRectangles([]);
  };

  const addNewCategory = () => {
    const newCategoryName = window.prompt('请输入新类别的名称：');
    const newCategoryColor = window.prompt('请输入新类别的颜色(格式如 #RRGGBB)：');
    if (newCategoryName && newCategoryColor) {
      document.documentElement.style.setProperty('--category-color', newCategoryColor); // 为新类别的颜色设置为 CSS 变量，方便灵活调整按钮颜色
      const newLabelColorMap = {...labelColorMapState};
      newLabelColorMap[newCategoryName] = newCategoryColor;
      setLabelColorMapState(newLabelColorMap);
      setDropdownVisible(false);
      setDropdownVisible(true);
      console.log(newLabelColorMap);

      // 存储新类别的颜色
      const buttonColor = newCategoryColor;

      return (
        <button onClick={addNewCategory} style={{ backgroundColor: buttonColor }} className="add-category-style">增加类别</button>
      );
    } else {
      alert('输入有误。');
      return null;
    }
  };

  const removeCategory = () => {
    const categoryToRemove = window.prompt('请输入要删除的类别的名称：');
    if (categoryToRemove && labelColorMapState.hasOwnProperty(categoryToRemove)) {
      const newLabelColorMap = {...shapeColorMap };
      delete newLabelColorMap[categoryToRemove];
      setLabelColorMapState(newLabelColorMap);
      setDropdownVisible(false);
      setDropdownVisible(true);
    } else {
      alert('输入有误。');
    }
  };

  const addNewTag = () => {
    const newTagName = window.prompt('请输入新Tag的名称：');
    const newTagColor = window.prompt('请输入新Tag的颜色(格式如 #RRGGBB)：');
    document.documentElement.style.setProperty('--tag-color', newTagColor); // 为新类别的颜色设置为 CSS 变量，方便灵活调整按钮颜色

    if (newTagName && newTagColor) {
      const newTagColorMap = {...tagColorMapState};
      newTagColorMap[newTagName] = newTagColor;
      setTagColorMapState(newTagColorMap);
      setDropdownVisible(false);
      setDropdownVisible(true);
      console.log(newTagColorMap);

      // 存储新类别的颜色
      const buttonColor = newTagColor;

      return (
        <button onClick={addNewTag} style={{ backgroundColor: buttonColor }} className="add-category-style">增加Tag</button>
      );
    } else {
      alert('输入有误');
      return null;
    }
  };

  const removeTag = () => {
    const tagToRemove = window.prompt('请输入要删除Tag的名称：');
    if (tagToRemove && tagColorMapState.hasOwnProperty(tagToRemove)) {
      const newTagColorMap = {...tagColorMap };
      delete newTagColorMap[tagToRemove];
      setTagColorMapState(newTagColorMap);
      setDropdownVisible(false);
      setDropdownVisible(true);
    } else {
      alert('输入有误。');
    }
  };

  // 展示 label 的颜色列表
  const ShowLabelColorList = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '10px' }}>
        {Object.entries(labelColorMapState).map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ width: 20, height: 20, backgroundColor: color, marginRight: '5px' }}></div>
            <div>{label}</div>
          </div>
        ))}
      </div>
    );
  };
  // 展示 tag 的颜色列表
  const ShowTagColorList = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: '10px' }}>
        {Object.entries(tagColorMapState).map(([tag, color]) => (
          <div key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ width: 20, height: 20, backgroundColor: color, marginRight: '5px' }}></div>
            <div>{tag}</div>
          </div>
        ))}
      </div>
    );
  };

  // 处理保存图像的函数
  // const handleSaveImage = async () => {
  //     if (canvasRef.current) {
  //         const canvas = canvasRef.current;
  //         const dataURL = canvas.toDataURL('image/png');
  //
  //         // 将 dataURL 转换为 Blob 对象
  //         const byteString = atob(dataURL.split(',')[1]);
  //         const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  //         const ab = new ArrayBuffer(byteString.length);
  //         const ia = new Uint8Array(ab);
  //         for (let i = 0; i < byteString.length; i++) {
  //             ia[i] = byteString.charCodeAt(i);
  //         }
  //         const blob = new Blob([ab], { type: mimeString });
  //
  //         try {
  //             // 构造请求数据
  //             const saveFileRequest = {
  //                 userId: 1,
  //                 text: userText,
  //                 color: textColor,
  //                 timestamp: 1111111,
  //                 imageFile: blob,
  //             };
  //             const response = await saveUsingPost(saveFileRequest);
  //
  //             if (response.ok) {
  //                 const result = await response.json();
  //                 alert('图片已保存到数据库！可访问地址：' + result);
  //             } else {
  //                 alert('保存失败！');
  //             }
  //         } catch (error) {
  //             console.error('Error:', error);
  //             alert('网络错误，请稍后再试！');
  //         }
  //     } else {
  //         alert('没有可保存的图片。');
  //     }
  // };
  //
  // // 切换窗口显示大小
  // const toggleFullSize = () => {
  //     setShowFullSize(prev =>!prev);
  // };
  //
  // // 新增窗口显示完整 json 内容
  // const openFullJsonWindow = () => {
  //     const newWindow = window.open('', '_blank');
  //     if (newWindow) {
  //         newWindow.document.write(`<pre>${jsonInput}</pre>`);
  //         newWindow.document.title = '完整 JSON 内容';
  //         newWindow.document.body.style.margin = '20px';
  //         newWindow.document.body.style.fontFamily = 'monospace';
  //     }
  // };

  // 处理用户输入的文字变化
  // const handleUserTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setUserText(event.target.value);
  // };

  // 处理用户输入的文字颜色变化
  // const handleTextColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //     setTextColor(event.target.value);
  // };
  const getLabelFromColor = (color: string) => {
    for (const [label, value] of Object.entries(labelColorMapState)) {
      if (value === color) {
        return label;
      }
    }
    return 'unknown';
  };
  const drawTextOnCanvas = (x, y, text) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '12px Arial';
        ctx.fillStyle = 'black';
        ctx.fillText(text, x, y);
      }
    }
  };

  // 处理鼠标抬起事件
  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (startX!== null && startY!== null && canvasRef.current &&!isDrawingDisabled) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const endX = event.clientX - canvasRef.current.getBoundingClientRect().left;
        const endY = event.clientY - canvasRef.current.getBoundingClientRect().top;
        let colorToUse = selectedColorForShape;
        if (newCategoryButtonColor) {
          colorToUse = newCategoryButtonColor;
        }
        if (selectedShape === 'rectangle') {
          const newRectangle = {
            x: startX,
            y: startY,
            width: endX - startX,
            height: endY - startY,
            color: colorToUse
          };
          setDrawnRectangles([...drawnRectangles, newRectangle]);
          // 更新 JSON 数据
          try {
            const currentJson = JSON.parse(jsonInput);
            const label = getLabelFromColor(colorToUse);
            const newShape = {
              label: label,
              points: [
                [newRectangle.x, newRectangle.y],
                [newRectangle.x + newRectangle.width, newRectangle.y + newRectangle.height]
              ],
              group_id: null,
              shape_type: "rectangle",
              flags: {}
            };
            currentJson.shapes = [...currentJson.shapes, newShape];
            setJsonInput(JSON.stringify(currentJson));
          } catch (error) {
            console.error('Invalid JSON input:', jsonInput);
          }

          // 计算文本位置并绘制文本，使用当前矩形数组长度作为编号
          const rectangleNumber = drawnRectangles.length;
          const textX = newRectangle.x + newRectangle.width - 10;
          const textY = newRectangle.y + 10;
          drawTextOnCanvas(textX, textY, rectangleNumber.toString());
        } else if (selectedShape === 'circle') {
          const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) / 2;
          const newCircle = {
            x: startX - radius,
            y: startY - radius,
            width: radius * 2,
            height: radius * 2,
            color: colorToUse
          };
          setDrawnRectangles([...drawnRectangles, newCircle]);
          // 更新 JSON 数据 for circle
          try {
            const currentJson = JSON.parse(jsonInput);
            const label = getLabelFromColor(colorToUse);
            const centerX = startX;
            const centerY = startY;
            const newShapeCircle = {
              label: label,
              points: [
                [centerX - radius, centerY - radius],
                [centerX + radius, centerY + radius]
              ],
              group_id: null,
              shape_type: "circle",
              flags: {}
            };
            currentJson.shapes = [...currentJson.shapes, newShapeCircle];
            setJsonInput(JSON.stringify(currentJson));
          } catch (error) {
            console.error('Invalid JSON input:', jsonInput);
          }
        }
      }
    }
    setStartX(null);
    setStartY(null);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasRef.current && startX!== null && startY!== null &&!isDrawingDisabled) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // 不再清除整个画布，只清除正在绘制的矩形区域
        // ctx.clearRect(
        //   startX,
        //   startY,
        //   event.clientX - canvasRef.current.getBoundingClientRect().left - startX,
        //   event.clientY - canvasRef.current.getBoundingClientRect().top - startY
        // );
        const img = new Image();
        img.onload = () => {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx?.drawImage(img, 0, 0, img.width, img.height);

          drawnRectangles.forEach(rect => {
            ctx.strokeStyle = rect.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
          });

          ctx.strokeStyle = newCategoryButtonColor;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(
            startX,
            startY,
            event.clientX - canvasRef.current.getBoundingClientRect().left - startX,
            event.clientY - canvasRef.current.getBoundingClientRect().top - startY
          );
          ctx.stroke();
        };
        img.src = imageUrl;
      }
    }
  };

  // 处理撤销操作
  const handleUndo = () => {
    if (drawnRectangles.length > 0) {
      setDrawnRectangles(drawnRectangles.slice(0, -1));
    }
    try {
      const currentJson = JSON.parse(jsonInput);
      currentJson.shapes = currentJson.shapes.slice(0, -1);
      setJsonInput(JSON.stringify(currentJson));
    } catch (error) {
      console.error('Invalid JSON input during undo:', jsonInput);
    }
  };

  const fillSelectedRectangles = () => {
    if (canvasRef.current && selectButtonHighlighted && selectedRectangleIndex!== null) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const selectedRect = drawnRectangles[selectedRectangleIndex];
        const isAlreadyStained = stainedRectangles.some(rect =>
          rect.x === selectedRect.x && rect.y === selectedRect.y &&
          rect.width === selectedRect.width && rect.height === selectedRect.height
        );
        if (!isAlreadyStained) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = newTagButtonColor;
          ctx.fillRect(selectedRect.x, selectedRect.y, selectedRect.width, selectedRect.height);
          setStainedRectangles([
            ...stainedRectangles,
            { x: selectedRect.x, y: selectedRect.y, width: selectedRect.width, height: selectedRect.height, color: newTagButtonColor },
          ]);
          // 建立 tag 和 rectangle 的关系并存储
          setTagRectangleRelations([...tagRectangleRelations, { rectangleIndex: selectedRectangleIndex, tag:  tagInput }]);
        }
      }
    }
  };

  // 展示 tag 和 rectangle 的关系
  const showTagRectangleRelations = () => {
    return (
      <div style={{ marginTop: '10px' }}>
        {tagRectangleRelations.map((relation, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div>{relation.rectangleIndex + 1} - {relation.tag}</div>
          </div>
        ))}
      </div>
    );
  };
  const clearStain = () => {
    setStainedRectangles([]);
  };

  const handleUndoFill = () => {
    // 移除最后一个填充的矩形关系
    if (stainedRectangles.length > 0) {
      setStainedRectangles(stainedRectangles.slice(0, -1));
      setTagRectangleRelations(tagRectangleRelations.slice(0, -1));
    }
  };

  // 处理 JSON 格式数据绘制
  const drawRectanglesFromJson = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      if (jsonData.shapes && Array.isArray(jsonData.shapes)) {
        const newRectangles = jsonData.shapes
          .filter(shape => shape.shape_type === 'rectangle')
          .map(shape => {
            const originalPoints = shape.points;
            const adjustedPoints = originalPoints.map(point => {
              return point.map(coordinate => {
                const num = parseFloat(coordinate);
                return num % 1 === 0? num + '.0' : num.toFixed(1);
              });
            });
            return {
              x: adjustedPoints[0][0],
              y: adjustedPoints[0][1],
              width: adjustedPoints[1][0] - adjustedPoints[0][0],
              height: adjustedPoints[1][1] - adjustedPoints[0][1],
              color: shapeColorMap[shape.label] || 'red'
            };
          });
        setDrawnRectangles([...drawnRectangles,...newRectangles]);
      } else {
        alert('无效的 JSON 格式。');
      }
    } catch (error) {
      alert('解析 JSON 时出错。');
    }
  };

  // 处理撤销 JSON 绘制框
  const handleUndoJsonRectangles = () => {
    // 设置 JSON 为初始状态的空对象
    setJsonInput(JSON.stringify({ "shapes": [] }, null, 2));
    // 同时清空绘制的矩形数组
    setDrawnRectangles([]);
  };

  // 判断是否为 JSON 绘制的矩形
// 在组件渲染完成后执行的函数
  useEffect(() => {
    if (selectedFile && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);

          // 绘制原始绘制的矩形和圆形，并绘制对应的文字
          drawnRectangles.forEach((rect, index) => {
            ctx.strokeStyle = rect.color;
            ctx.lineWidth = 2;
            if (selectedShape === 'rectangle') {
              ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
              const textX = rect.x + rect.width + 3;
              const textY = rect.y -3;
              drawTextOnCanvas(textX, textY, (index + 1).toString());
            } else if (selectedShape === 'circle') {
              ctx.beginPath();
              ctx.arc(rect.x + rect.width / 2, rect.y + rect.height / 2, rect.width / 2, 0, 2 * Math.PI);
              ctx.stroke();
            }
          });

          // 绘制染色后的矩形
          stainedRectangles.forEach(rect => {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = rect.color;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
          });

          // 更新 JSON 数据中的高和宽
          try {
            const currentJson = JSON.parse(jsonInput);
            currentJson.imageWidth = canvasRef.current.width;
            currentJson.imageHeight = canvasRef.current.height;
            setJsonInput(JSON.stringify(currentJson));
          } catch (error) {
            console.error('Invalid JSON input:', jsonInput);
          }
        };
        img.src = imageUrl;
      }
    }
  }, [selectedFile, imageUrl, userText, textColor, drawnRectangles, stainedRectangles, tagRectangleRelations]);
// 处理输入框宽度变化
  let isResizing = false;
  let initialMouseX: number;
  let initialWidth: number;
  let initialMouseY: number;
  let initialHeight: number;

  function handleInputResize(event) {
    isResizing = true;
    initialMouseX = event.clientX;
    initialWidth = parseInt(document.querySelector('.json-input').style.width, 10);
    initialMouseY = event.clientY;
    initialHeight = parseInt(document.querySelector('.json-input').style.height, 10);
    document.addEventListener('mousemove', resizeInput);
    document.addEventListener('mouseup', stopResizing);
  }

  function resizeInput(event) {
    if (isResizing) {
      const deltaX = event.clientX - initialMouseX;
      const newWidth = initialWidth + deltaX;
      document.querySelector('.json-input').style.width = `${newWidth}px`;

      const deltaY = event.clientY - initialMouseY;
      const newHeight = initialHeight + deltaY;
      document.querySelector('.json-input').style.height = `${newHeight}px`;
    }
  }

  function stopResizing() {
    isResizing = false;
    document.removeEventListener('mousemove', resizeInput);
    document.removeEventListener('mouseup', stopResizing);
  }

  //  --------------------//



  // 欢迎页面组件
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="welcome-page">
        <header className="header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* 页面标题 */}
          <h1>{getButtonText('title')}</h1>
        </header>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <h2 style={{ margin: '0 20px' }}>{getButtonText('subTitle')}</h2>
        </div>
      </div>
      <div className="content">
        {/* 文件上传输入框 */}
        <div className="custom-file-button">
          {getButtonText('fileUpload')}
          <input type="file" onChange={handleFileChange} className="hidden-file-input" />
        </div>
        {/*/!* 颜色选择输入框 *!/*/}
        {/*<input*/}
        {/*    type="color"*/}
        {/*    value={textColor}*/}
        {/*    onChange={handleTextColorChange}*/}
        {/*    className="color-input"*/}
        {/*/>*/}
        {/*<div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'top' }}>*/}
        {/*<textarea*/}
        {/*    ref={inputRef}*/}
        {/*    value={jsonInput}*/}
        {/*    onChange={(e) => setJsonInput(e.target.value)}*/}
        {/*    placeholder="输入 JSON 格式数据"*/}
        {/*    className="json-input"*/}
        {/*    style={{ height: '60px', overflowY: 'scroll', width: `${inputWidth}px`, resize: 'none' }}*/}
        {/*/>*/}
        {/*    <button onClick={() => openFullJsonWindow()} className="maximize-json-button" style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '12px' }}>Full</button>*/}
        {/*    /!*右侧可拖动区域，用于调整宽度(ew-resize：east-west resize)*!/*/}
        {/*    <div onMouseDown={handleInputResize} style={{ position: 'absolute', right: -5, top: 0, height: '100%', width: 10, cursor: 'ew-resize' }} />*/}
        {/*    /!* 顶部可拖动区域，用于调整高度(ns-resize：north-south resize) *!/*/}
        {/*    /!*<div onMouseDown={handleInputResize} style={{ position: 'absolute', top: -5, left: 0, right: 0, height: 10, cursor: 'ns-resize' }} />*!/*/}
        {/*    /!* 底部可拖动区域，用于调整高度(ns-resize：north-south resize) *!/*/}
        {/*    <div onMouseDown={handleInputResize} style={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 10, cursor: 'ns-resize' }} />*/}
        {/*    /!* 左侧可拖动区域，用于调整宽度(ew-resize：east-west resize) *!/*/}
        {/*    /!*<div onMouseDown={handleInputResize} style={{ position: 'absolute', top: 0, bottom: 0, left: -5, width: 10, cursor: 'ew-resize' }} />*!/*/}

        {/*</div>*/}
        {/* 解析 JSON 按钮 */}
        {selectedFile && (
          <div className="image-container" style={{ display: 'flex', alignItems: 'center' }}>
            {/* 画布组件，用于显示图像 */}
            <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} />
            <div style={{ position: 'relative', display: 'inline-block', verticalAlign: 'top' }}>
              {/* 添加带有悬浮下拉框的按钮 */}
              {(
                <div style={{ marginTop: '10px' }}>
                  <Popover
                    content={
                      <div className="dropdown-float">
                        {Object.entries(labelColorMapState).map(([label, color]) => (
                          <div key={label} onClick={() => handleNewCategoryButtonClick(color)} className={`${label}-option`}>
                            {label}
                          </div>
                        ))}
                        <button onClick={addNewCategory} className="add-category-button">{getButtonText('addCategoryButton')}</button>
                        <button onClick={removeCategory} className="remove-category-button">{getButtonText('removeCategoryButton')}</button>
                      </div>
                    }
                    // title="选择颜色"
                    trigger="hover"
                  >
                    <button className="draw-custom-shape-button">{getButtonText('selectColorButton')}</button>
                  </Popover>
                  <button onClick={drawRectanglesFromJson} className="analyze-json-button">{getButtonText('parseJsonButton')}</button>
                </div>
              )}
              <textarea
                ref={inputRef}
                value={formatJsonForDisplay(jsonInput)}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="输入 JSON 格式数据"
                className="json-input"
                style={{ height: '420px', overflowY: 'scroll', width: `${inputWidth * 1.3}px`, resize: 'none' }}
              />

              {/*<JsonViewer />*/}
              {/*<button onClick={() => openFullJsonWindow()} className="maximize-json-button" style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '12px' }}>Full</button>*/}
              {/*右侧可拖动区域，用于调整宽度(ew-resize：east-west resize)*/}
              <div onMouseDown={handleInputResize} style={{ position: 'absolute', right: -5, top: 0, height: '100%', width: 10, cursor: 'ew-resize' }} />
              {/* 顶部可拖动区域，用于调整高度(ns-resize：north-south resize) */}
              {/*<div onMouseDown={handleInputResize} style={{ position: 'absolute', top: -5, left: 0, right: 0, height: 10, cursor: 'ns-resize' }} />*/}
              {/* 底部可拖动区域，用于调整高度(ns-resize：north-south resize) */}
              <div onMouseDown={handleInputResize} style={{ position: 'absolute', bottom: -5, left: 0, right: 0, height: 10, cursor: 'ns-resize' }} />
              {/* 左侧可拖动区域，用于调整宽度(ew-resize：east-west resize) */}
              {/*<div onMouseDown={handleInputResize} style={{ position: 'absolute', top: 0, bottom: 0, left: -5, width: 10, cursor: 'ew-resize' }} />*/}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              {/* 显示名称的文本框 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input type="text" defaultValue="Name" style={{ width: '70px', margin: '8px 0', color: textColor }} />
                <div className="text-display" style={{ color: textColor, marginRight: '88', padding: '5px' }}>:</div>
                <input type="text" style={{ width: '150px', margin: '8px 0' }} />
              </div>
              {/* 显示输入的文本框 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input type="text" defaultValue="Input" style={{ width: '70px', margin: '8px 0', color: textColor }} />
                <div className="text-display" style={{ color: textColor, marginRight: '88', padding: '5px' }}>:</div>
                <input type="text" style={{ width: '150px', margin: '8px 0' }} />
              </div>
              {/* 显示输出的文本框 */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input type="text" defaultValue="Output" style={{ width: '70px', margin: '8px 0', color: textColor }} />
                <div className="text-display" style={{ color: textColor, marginRight: '88', padding: '5px' }}>:</div>
                <input type="text" style={{ width: '150px', margin: '8px 0' }} />
              </div>
              {textboxPairs.map(pair => (
                <div key={pair.id} style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                  <input
                    type="text"
                    value={pair.leftInput}
                    onChange={(e) =>
                      setTextboxPairs(textboxPairs.map(p =>
                        p.id === pair.id? {...p, leftInput: e.target.value } : p
                      ))
                    }
                    style={{ width: '70px', margin: '0', color: textColor }}
                  />
                  <div className="text-display" style={{ color: textColor, marginRight: '88', padding: '5px' }}>:</div>
                  <input
                    type="text"
                    value={pair.rightInput}
                    onChange={(e) =>
                      setTextboxPairs(textboxPairs.map(p =>
                        p.id === pair.id? {...p, rightInput: e.target.value } : p
                      ))
                    }
                    style={{ width: '150px', margin: '0' }}
                  />
                  <button onClick={() => deleteTextboxPair(pair.id)} className="delete-textbox-button" style={{ marginTop: '8px', marginLeft: '8px', width: '100px' }}>{getButtonText('removeTextboxPair')}</button>
                </div>
              ))}
              {/* 增加空白的文本框 : 文本框  */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                <button onClick={addTextboxPair} className="add-textbox-button" style={{ marginTop: '8px', width: '100px' }}>{getButtonText('addTextboxPair')}</button>
              </div>
              {/*    显示colorlist*/}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="text-display" style={{ color: textColor, marginRight: '8px' }}>{ShowLabelColorList()}</div>
                <div className="text-display" style={{ color: textColor, marginRight: '8px' }}>{ShowTagColorList()}</div>
                <div className="text-display" style={{ color: textColor, marginRight: '8px' }}>{showTagRectangleRelations()}</div>
              </div>
            </div>
          </div>
        )}
        {imageUrl && (
          <div className="image-preview">
            <div className="image-actions">
              {/* 现有按钮 */}
              {/*<button onClick={handleSaveImage} className="save-button">保存图片</button>*/}
              <button onClick={handleDeleteImage} className="delete-button">{getButtonText('deleteButton')}</button>
              {/*撤回 + 悬浮框里面是清除*/}
              <Popover
                content={
                  <div className="dropdown-float">
                    <button onClick={handleUndoJsonRectangles} className="clear-button">{getButtonText('clearButton')}</button>
                  </div>
                }
                trigger="hover"
              >
                <button onClick={handleUndo} className="undo-button">{getButtonText('undoButton')}</button>
              </Popover>
              <button onClick={handleSaveImageToLocal} className="save-to-local-button">{getButtonText('saveToLocalButton')}</button>
              <button className={`select-button${selectButtonHighlighted? ' highlighted' : ''}`} onClick={handleSelectButtonClick}>{getButtonText('selectRectangleButton')}</button>
              <Popover
                content={
                  <div className="dropdown-float">
                    {Object.entries(tagColorMapState).map(([label, color]) => (
                      <div key={label} onClick={() => handleNewTagButtonClick(color)} className={`${label}-option`}>
                        {label}
                      </div>
                    ))}
                    <button onClick={addNewTag} className="add-tag-button">{getButtonText('addTagButton')}</button>
                    <button onClick={removeTag} className="remove-tag-button">{getButtonText('removeTagButton')}</button>
                  </div>
                }
                // title="选择颜色"
                trigger="hover"
              >
                <button onClick={fillSelectedRectangles} className="draw-custom-shape-button">{getButtonText('selectTagButton')}</button>
              </Popover>
              <Popover
                content={
                  <div className="dropdown-float">
                    <button onClick={clearStain} className="undo-stain-button">{getButtonText('clearStain')}</button>
                  </div>
                }
                trigger="hover"
              >
                <button onClick={handleUndoFill} className="undo-button">{getButtonText('undoStain')}</button>
              </Popover>
              {/*<input type="text" placeholder="输入标签名称" onChange={(e) => setTagInput(e.target.value)} className="tag-input" />*/}
              {/*<div style={{ marginTop: '5px' }}>{tagInput && selectedFillColor && `${tagInput} | ${selectedFillColor}`}</div>*/}
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'fixed', top: '80px', right: '10px' }}>
        <button onClick={toggleButtonTexts}>{getButtonText('EN_CN_button')}</button>
      </div>
    </div>
  );
};



export default FileOperate;
