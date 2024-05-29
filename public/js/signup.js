
//Vars
var fName = document.querySelector('#fName');
var lName = document.querySelector('#lName');
var uName = document.querySelector('#uName');
var pwd = document.querySelector('#password');
var repwd = document.querySelector('#repassword');
var feedback = document.querySelector('#feedback');
var bday = document.querySelector('#bday');
var button = document.querySelector('#subButton');

var fields = [fName, lName, uName, pwd, repwd, bday];



//Event listeners
for(let field of fields){
  field.addEventListener('change', updateButton);
}



//Functions
function updateButton(){
  if(checkFields()){
    if(pwd.value != repwd.value){
      feedback.innerHTML = `<span style="color:red">Passwords dont match!</span>`;
    } else{
      feedback.innerHTML = "";
      button.disabled = false;
      
    }
  }
};

function checkFields(){
  for(let field of fields){
    if(field.value == ""){
      return false;
    };
  };
  return true;
}
