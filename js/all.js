//取得產品列表
const productList = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');
const cartList = document.querySelector('.shoppingCart-tableList');
let productData = [];
let cartData = [];

//初始化
function init(){
    getProductList();
    getCartList();
}
init();

function getProductList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
    .then(function(response){
        productData= response.data.products;
        renderProductList();     
    })
    .catch(function(error){
        console.log(error.response.data)
    })
}

//productList字串整理，消除重複
function tidyHTMLProductList(item){
    return `<li class="productCard">
    <h4 class="productType">新品</h4>
    <img src="${item.images}" alt="">
    <a href="#" class="js-addCart" id="addCardBtn" data-id=${item.id}>加入購物車</a>
    <h3>${item.title}</h3>
    <del class="originPrice">NT$${item.origin_price}</del>
    <p class="nowPrice">NT$${item.price}</p>
    </li>`
}

//顯示全部
function renderProductList(){
    let str ="";
    productData.forEach(function(item){
        str+=tidyHTMLProductList(item);
    })
    productList.innerHTML = str;
    
}

//下拉選單
productSelect.addEventListener('change',function(e){
    const category = e.target.value;
    if(category=='全部'){
        renderProductList();
        return;
    }
    let str="";
    productData.forEach(function(item){
        if(item.category==category){
            str+=tidyHTMLProductList(item);  
        }
    })
    productList.innerHTML = str;
})

//綁定加入購物車
productList.addEventListener("click",function(e){
    e.preventDefault();
    //console.log(e.target.getAttribute("data-id"));
    let addCartClass = e.target.getAttribute("class");
    if(addCartClass!=="js-addCart"){
        return;
    }
    let productId = e.target.getAttribute("data-id");
    console.log(productId);
    //確認產品數量
    let numCheck = 1;
    cartData.forEach(function(item){
        if(item.product.id===productId){
            numCheck = item.quantity+=1;
        }
    })
    //加入購物車
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`,{
        data: {
        productId: productId,
        quantity: numCheck,
        }
      })
      .then(function(response){
        alert("加入購物車");
        getCartList();
      })
      .catch(function(error){
        console.log(error.response.data);
      })
})


//取得購物車列表
function getCartList(){
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        //修改訂單總金額
        document.querySelector(".js-total").textContent=toThousands(response.data.finalTotal);
        cartData = response.data.carts;
        let str="";
        cartData.forEach(function(item){
            str +=` <tr>
            <td>
                <div class="cardItem-title">
                    <img src="${item.product.images}" alt="">
                    <p>${item.product.title}</p>
                </div>
            </td>
            <td>NT$${toThousands(item.product.price)}</td>
            <td>${item.quantity}</td>
            <td>NT$${toThousands(item.product.price*item.quantity)}</td>
            <td class="discardBtn">
                <a href="#" class="material-icons" data-id="${item.id}">
                    clear
                </a>
            </td>
        </tr>`
        });
        
        cartList.innerHTML=str;
    })
    .catch(function(error){
        console.log(error.response.data);
    })
}

cartList.addEventListener('click',function(e){
    e.preventDefault();
    const cartId = e.target.getAttribute("data-id");
    if(cartId==null){
        return;
    }
    //刪除購物車內特定產品 
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
    .then(function(response){
        alert("刪除單筆購物車成功");
        getCartList();
    })
    .catch(function(error){
        console.log(error.response.data);
    })
})

//刪除全部購物車
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click",function(e){
    e.preventDefault()
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(e){
        alert("刪除全部購物車成功");
        getCartList();
    })
    .catch(function(error){
        console.log(error.response.data);
    })
    
})

//送出訂單
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click",function(e){
    e.preventDefault();
    if(cartData.length==0){
        alert("請加入購物車");
        return;
    }
    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const customerTradeWay = document.querySelector("#tradeWay").value;
    if(customerName==""||customerPhone==""||customerEmail==""||customerAddress==""||customerTradeWay==""){
        alert("請輸入訂單資訊");
        return;
    }

    //驗證email
    if(validateEmail(customerEmail)==false){
        alert("請填寫正確Email格式");
        return;
    };

    //送出購物訂單
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`,{
        "data": {
          "user": {
            "name": customerName,
            "tel": customerPhone,
            "email": customerEmail,
            "address": customerAddress,
            "payment": customerTradeWay,
          }
        }
      })
    .then(function(response){
        alert("訂單建立成功");
        //送出資料後清空表單
        document.querySelector("#customerName").value="";
        document.querySelector("#customerPhone").value="";
        document.querySelector("#customerEmail").value="";
        document.querySelector("#customerAddress").value="";
        document.querySelector("#tradeWay").value="ATM";
        getCartList();
    })
    .catch(function(error){
        console.log(error.response.data);
    })
})

//email格式錯誤提示
const customerEmail = document.querySelector("#customerEmail");
customerEmail.addEventListener("blur",function(e){
    if(validateEmail(customerEmail.value)==false){
        alert("請填寫正確Email格式");
        return;
    };
})

//util js 元件
function validateEmail(mail) 
{
 if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail))
  {
    return true;
  }
    return false;
}



