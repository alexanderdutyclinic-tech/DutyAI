function createDoctorCard(doctor) {

    return `

    <div class="doctor-card">

        <img 
        class="doctor-image"
        src="${doctor.image || ''}"
        >

        <div class="doctor-info">

            <h2>
            ${doctor.name}
            </h2>


            <h3>
            ${doctor.specialty}
            </h3>


            <p>
            ${doctor.expertise 
                ? doctor.expertise.slice(0,4).join(" • ")
                : ""
            }
            </p>


        </div>

    </div>

    `;

}



function createDoctorsSection(doctors){

    return doctors
        .map(createDoctorCard)
        .join("");

}


export {
    createDoctorCard,
    createDoctorsSection
};