function generatePremiumCover(data){

    return `
    
    <html>

    <head>

    <style>

    body{
        margin:0;
        font-family: Arial, sans-serif;
    }


    .cover{

        height:100vh;

        background:
        linear-gradient(
        rgba(0,0,0,0.45),
        rgba(0,0,0,0.65)
        ),
        url("${data.backgroundImage}");

        background-size:cover;

        color:white;

    }


    .overlay{

        padding:80px;

        text-align:center;

    }


    .logo{

        width:180px;

        margin-bottom:120px;

    }


    h1{

        font-size:48px;

        letter-spacing:3px;

    }


    .patient-box{

        margin-top:80px;

    }


    h2{

        font-size:35px;

    }


    .location{

        margin-top:100px;

        font-size:18px;

    }


    </style>


    </head>


    <body>

    ${createCoverContent(data)}

    </body>

    </html>

    `;

}



function createCoverContent(data){

return `

<div class="cover">


<div class="overlay">


<img 
class="logo"
src="${data.logo}"
>


<h1>

PERSONALIZED<br>
DENTAL<br>
TREATMENT<br>
PROPOSAL

</h1>


<div class="patient-box">

<p>
Prepared for:
</p>

<h2>
${data.patientName}
</h2>

</div>


<p class="location">

Duty Clinic Istanbul<br>
Istanbul, Türkiye

</p>


</div>


</div>


`;

}


export {
generatePremiumCover
};