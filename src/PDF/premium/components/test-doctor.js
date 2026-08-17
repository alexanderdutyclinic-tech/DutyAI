import {createDoctorsSection}
from "./doctor-component.js";


const testDoctor = [

{
name:"Dr. Vahap Çin",

specialty:
"Prosthetic Dentistry",

image:
"assets/doctors/vahap.jpg",

expertise:[
"Digital Smile Design",
"Implant Prosthetics",
"Veneers"
]

}

];


console.log(
createDoctorsSection(testDoctor)
);