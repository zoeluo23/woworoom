//orderData重構資料用
let orderData=[];
const orderList = document.querySelector(".js-orderList");
//初始化
function init(){
    getOrderList();
}
init();
//C3
function renderC3(){
        //物件資料蒐集
        let total ={};
        orderData.forEach(function(item){
            item.products.forEach(function(productItem){
                if(total[productItem.category]==undefined){
                    total[productItem.category]=productItem.price*productItem.quantity;
                }else{
                    total[productItem.category]+=productItem.price*productItem.quantity;
                }
            })   
        });
        console.log(total);
            //做出資料關聯
        let categoryAry = Object.keys(total);
        console.log(categoryAry);
        let newData = [];
        categoryAry.forEach(function(item){
            let ary=[];
            ary.push(item);
            ary.push(total[item]);
        newData.push(ary);
    });
    console.log(newData);

    //C3.js
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newData,
            colors:{
                "Louvre 雙人床架":"#DACBFF",
                "Antony 雙人床架":"#9D7FEA",
                "Anty 雙人床架": "#5434A7",
                "其他": "#301E5F",
            }
        },
    });


}

function renderC3_lv2(){
    //資料蒐集
    let obj={};
    orderData.forEach(function(item){
        item.products.forEach(function(productItem){
            if(obj[productItem.title]===undefined){
                obj[productItem.title]=productItem.quantity*productItem.price;
            }else{
                obj[productItem.title]+=productItem.quantity*productItem.price;
            };
        });
    });

    //拉出資料關聯
    let originAry = Object.keys(obj);
    console.log(originAry);
    //透過 originAry，整理成 C3 格式
    let rankSortAry = [];

    originAry.forEach(function(item){
        let ary = [];
        ary.push(item);
        ary.push(obj[item]);
        rankSortAry.push(ary);
    });
    console.log(rankSortAry);

    //比大小，降冪排序
    rankSortAry.sort(function(a,b){
        return b[1]-a[1];
    });
    
    //如果超過4筆以上，統整為其他
    if(rankSortAry.length > 3){
        let otherTotal = 0;
        rankSortAry.forEach(function(item,index){
            if(index > 2){
                otherTotal+= rankSortAry[index][1];
            };
        });
        rankSortAry.splice(3,rankSortAry.length-1);
        rankSortAry.push('其他',otherTotal);
    }

    //超過三筆後將第四名之後的價格加總放在 otherTotal
    //C3 圖表
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: rankSortAry,
            colors:{
                pattern:["#301E5F","#5434A7","#9D7FEA","#DACBFF"],
            }
        },
    });


};

//觀看後台訂單
function getOrderList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
    {
        headers:{
            "Authorization":token
        }
    })
    .then(function(response){
        orderData=response.data.orders;
        //組產品字串
        let str="";
        orderData.forEach(function(item){
             //組時間字串 *1000到十三碼
            const timeStamp = new Date(item.createdAt*1000);
            const orderTime =`${timeStamp.getFullYear()}/${timeStamp.getMonth()+1}/${timeStamp.getDate()}`;
        

            //組訂單字串
            let productStr="";
            item.products.forEach(function(productItem){
            productStr+=`<p>${productItem.title}x${productItem.quantity}</p>`   
            })

            //判斷訂單處理狀態
            let orderStatus="";
            if(item.paid==true){
                orderStatus="已處理";
            }else{
                orderStatus="未處理";
            }

            //組訂單字串 
            //data-status後續用來判斷訂單狀態用
            str+=`<tr>
            <td>${item.id}</td>
            <td>
              <p>${item.user.name}</p>
              <p>${item.user.tel}</p>
            </td>
            <td>${item.user.address}</td>
            <td>${item.user.email}</td>
            <td>
             ${productStr}
            </td>
            <td>${orderTime}</td>
            <td class="orderStatus js-orderStatus">
              <a href="#" data-status="${item.paid}" class="orderStatus" data-id="${item.id}">${orderStatus}</a>
            </td>
            <td>
              <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id=${item.id} value="刪除">
            </td>
        </tr>`
        })
        orderList.innerHTML = str;
        renderC3_lv2();
    })
    .catch(function(error){
        console.log(error.response.data);
    })
}

orderList.addEventListener("click",function(e){
    e.preventDefault();
    const tagetClass = e.target.getAttribute("class");
    //console.log(tagetClass);
    
    //id會重複用到，抓到外層。
    let id = e.target.getAttribute("data-id");
    if(tagetClass =="delSingleOrder-Btn js-orderDelete"){
       deleteOrderItem(id);
       return;
    }
    
    //訂單狀態(已處理、未處理)
    if(tagetClass =="orderStatus"){
        let status = e.target.getAttribute("data-status");
        editOrderList(status,id);
        return;
    }
})

//改訂單狀態
function editOrderList(status,id){
    let newStatus;
    if(status==true){
        newStatus=false;
    }else{
        newStatus=true;
    };
   //console.log(status,id); 

   axios.put(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`,
    {
        "data": {
          "id": id,
          "paid": newStatus,
        }
      },
      {
        headers: {
          'Authorization': token
        }
      })
      .then(function (response) {
        alert("修改訂單成功");
        getOrderList();
      })
}

//刪除特定訂單
function deleteOrderItem(id){
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`,
    {
        headers:{
            "Authorization":token
        }
    })
    .then(function(response){
        alert("刪除該筆訂單成功");
        getOrderList();
    })
    .catch(function(error){
        console.log(error.response.data);
    })
}

//util js 元件
function toThousands (x) {
    let parts = x.toString().split(".");
    parts[0]=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,",");
    return parts.join(".");
  }

