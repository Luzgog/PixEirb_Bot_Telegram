import PocketBase from "https://cdn.jsdelivr.net/npm/pocketbase@0.14.0/dist/pocketbase.es.mjs";

// Connecter à l'instance PocketBase (modifie l'URL selon ton cas)

const addResponseForm = document.getElementById("addResponseForm");
const editResponseForm = document.getElementById("editResponseForm");
const responseList = document.getElementById("responseList");
const deleteAllButton = document.getElementById("deleteAllButton");
const logoutButton = document.getElementById("logoutButton");
const fileInput = document.getElementById("fileInput");
const readFileButton = document.getElementById("readFileButton");
const forAdminHint = document.getElementById("admin-hint");

const pb = new PocketBase("/");


pb.autoCancellation(false);

function clearForm() {
    // Réinitialiser l'interface
    addResponseForm.style.display = "none"; // Cacher le formulaire d'ajout
    editResponseForm.style.display = "none"; // Cacher le formulaire de modification
    deleteAllButton.style.display = "none"; // Cacher le bouton "Tout Supprimer"
    logoutButton.style.display = "none"; // Cacher le bouton de déconnexion
    responseList.innerHTML = ""; // Vider la liste des réponses
    responseList.style.display = "none";
    fileInput.style.display = "none";
    readFileButton.style.display = "none";
    forAdminHint.style.display = "block";
}

async function displayForm() {
    addResponseForm.style.display = "block"; // Afficher le formulaire d'ajout
    deleteAllButton.style.display = "block"; // Afficher le bouton "Tout Supprimer"
    logoutButton.style.display = "block"; // Afficher le bouton de déconnexion
    responseList.style.display = "block";
    fileInput.style.display = "block";
    readFileButton.style.display = "block";
    forAdminHint.style.display = "none";
    await fetchResponses();
}

logoutButton.addEventListener("click", () => {
    pb.authStore.clear(); // Effacer les informations d'authentification
    clearForm();
});

async function auth_and_launch() {
    try {
        await pb.collection("users").authWithOAuth2({ provider: "oidc" });
        await displayForm();
    } catch (error) {
        if (error.status === 400) {
            alert(
                "Authentification échouée. Êtes-vous sur d'avoir les droits ? (Ratio)",
            );
        } else {
            console.error("Une autre erreur est survenue", error);
        }
    }

}

async function deleteResponse(recordId, responseListItem) {
    try {
        await pb.collection("Response").delete(recordId);
        responseListItem.remove();
    } catch (error) {
        console.error(
            "Erreur lors de la suppression de la réponse:",
            error,
        );
    }
}

// Fonction pour récupérer les réponses de la collection "Response"
async function fetchResponses() {
    try {
        const records = await pb.collection("Response").getFullList({
            sort: "-created",
        });

        responseList.innerHTML = ""; // Réinitialiser la liste

        records.forEach((record) => {
            const listItem = document.createElement("li");
            listItem.textContent = record.texte;

            // Bouton pour modifier la réponse
            const editButton = document.createElement("button");
            editButton.textContent = "Modifier";
            editButton.onclick = () => openEditForm(record);

            // Bouton pour supprimer la réponse
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.onclick = () => deleteResponse(record.id, listItem);

            listItem.appendChild(editButton);
            listItem.appendChild(deleteButton);
            responseList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des réponses:", error);
    }
}

async function add_new_response(x) {
    try {
        await pb.collection("Response").create({
            texte: x,
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la réponse:", error);
    }
}

// Fonction pour ajouter une nouvelle réponse
addResponseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newResponseText = document.getElementById("newResponse").value;
    await add_new_response(newResponseText);
    document.getElementById("newResponse").value = ""; // Réinitialiser le champ
    fetchResponses(); // Mettre à jour la liste des réponses
});

// Fonction pour ouvrir le formulaire de modification
function openEditForm(record) {
    document.getElementById("editResponseId").value = record.id;
    document.getElementById("editResponse").value = record.texte;
    addResponseForm.style.display = "none"; // Cacher le formulaire d'ajout
    editResponseForm.style.display = "block"; // Afficher le formulaire de modification
}

// Fonction pour modifier une réponse
editResponseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const responseId = document.getElementById("editResponseId").value;
    const updatedResponseText = document.getElementById("editResponse").value;

    try {
        // TODO: do not update if the content has not been edited
        await pb.collection("Response").update(responseId, {
            texte: updatedResponseText,
        });

        document.getElementById("editResponse").value = ""; // Réinitialiser le champ
        editResponseForm.style.display = "none"; // Cacher le formulaire de modification
        addResponseForm.style.display = "block"; // Afficher le formulaire d'ajout
        fetchResponses(); // Mettre à jour la liste des réponses
    } catch (error) {
        console.error("Erreur lors de la modification de la réponse:", error);
    }
});

// Fonction pour supprimer toutes les réponses
deleteAllButton.addEventListener("click", async () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer toutes les réponses ?")) {
        try {
            const records = await pb.collection("Response").getFullList(); // Récupérer toutes les réponses
            const deletePromises = records.map((record) =>
                pb.collection("Response").delete(record.id)
            ); // Créer des promesses de suppression

            await Promise.all(deletePromises); // Exécuter toutes les promesses
            fetchResponses(); // Mettre à jour la liste après suppression
        } catch (error) {
            console.error(
                "Erreur lors de la suppression de toutes les réponses:",
                error,
            );
        }
    }
});

readFileButton.addEventListener(
    "click",
    function () {
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = async (event) => {
                const csvContent = event.target.result;
                const rows = csvContent.split("\n");

                await Promise.all(rows.map((row) => add_new_response(row)));
                await fetchResponses(); // Mettre à jour la liste après suppression
            };

            reader.readAsText(file); // Lire le fichier en tant que texte
        } else {
            alert("Veuillez sélectionner un fichier !");
        }
    },
);

window.onload = auth_and_launch;
