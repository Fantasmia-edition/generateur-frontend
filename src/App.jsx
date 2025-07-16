import React, { useState, useEffect, useRef } from 'react'; // useRef n'est plus nécessaire pour le slider, mais peut être utile pour d'autres choses. On le garde pour l'instant.

const images = [
  '/images/image1.jpg',
  '/images/image2.jpg',
  '/images/image3.jpg',
  '/images/image4.jpg', 
  '/images/image5.jpg', 
  '/images/image6.jpg', 
];

// Ajoutez ceci quelque part en dehors de la fonction App, par exemple après la liste `images`

const styleSynonyms = {
  'Fantasy': 'fantastique, heroïc fantasy, médiéval fantastique, épique, mythologique',
  'Réaliste': 'photographique, hyperréaliste, ultra-détaillé, réaliste, rendu photo',
  'Cartoon': 'dessin animé, style bande dessinée, BD, animation, style Disney, Looney Tunes',
  'Manga': 'anime, style japonais, shonen, shojo, dessin manga',
  'Aquarelle': 'peinture à l\'eau, effet aquarelle, lavis, couleurs transparentes',
  'Dessin au crayon': 'esquisse, croquis, graphite, fusain, crayonné, illustration au crayon',
  // Ajoutez d'autres styles si vous en avez et leurs synonymes
  'illustration numérique de haute qualité, avec des lignes nettes et des ombres douces': 'illustration vectorielle, art digital, rendu numérique, haute définition, rendu 3D' // Pour votre valeur par défaut
};

function App() {
  const [form, setForm] = useState({
    nom: '',
    genre: '',
    age: '',
    origine: '',
    description: '',
    tenue: '',
    elements: '',
    expression: '',
    couleurs: '',
    style: '',
  });

  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const MAX_DAILY_GENERATIONS = 2; // <--- Définissez votre limite ici (ex: 5 générations par jour)
  const [dailyGenerations, setDailyGenerations] = useState(0); // État pour le compteur actuel
  const [backgroundType, setBackgroundType] = useState('white'); // 'white' ou 'context'
  const [contextPrompt, setContextPrompt] = useState(''); // Pour le nouveau champ de contexte

 // Hook useEffect pour initialiser le compteur au chargement de l'application
  useEffect(() => {
    const lastGenerationDate = localStorage.getItem('lastGenerationDate'); // Récupère la date de la dernière utilisation
    const today = new Date().toDateString(); // Date d'aujourd'hui au format "Wed Jul 16 2025"

    if (lastGenerationDate === today) {
      // Si la date stockée est la même qu'aujourd'hui, on récupère le compteur existant
      const count = parseInt(localStorage.getItem('dailyGenerationsCount') || '0', 10);
      setDailyGenerations(count);
    } else {
      // Si c'est un nouveau jour ou qu'aucune date n'est stockée, on réinitialise le compteur
      localStorage.setItem('lastGenerationDate', today); // Stocke la date d'aujourd'hui
      localStorage.setItem('dailyGenerationsCount', '0'); // Réinitialise le compteur
      setDailyGenerations(0); // Met à jour l'état React
    }
  }, []); // Le tableau vide [] signifie que cet effet ne s'exécute qu'une seule fois au montage du composant
  // --- FIN : AJOUT DU COMPTEUR DE GÉNÉRATION ---

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generatePrompt = () => {
    const {
      nom, genre, origine, age, description,
      tenue, elements, expression, couleurs, style,
    } = form;

    // --- DÉBUT : LOGIQUE MODIFIÉE POUR LE FOND ---
    const backgroundClause = backgroundType === 'white' 
      ? 'sur fond blanc' 
      : (contextPrompt ? `dans le contexte suivant : ${contextPrompt}` : 'dans un environnement détaillé'); // Fallback si le contexte est vide
    // --- FIN : LOGIQUE MODIFIÉE POUR LE FOND ---

  // --- DÉBUT : MODIFICATION POUR LES SYNONYMES DE STYLE ---

    // Récupère le style choisi ou le style par défaut
    const actualStyle = style || 'illustration numérique de haute qualité, avec des lignes nettes et des ombres douces';
    
    // Récupère les synonymes associés au style. Si aucun n'est trouvé, utilise juste le style.
    const reinforcedStyleTerms = styleSynonyms[actualStyle] ? `${actualStyle}, ${styleSynonyms[actualStyle]}` : actualStyle;

    const finalStyling = `Utiliser une palette de couleurs ${couleurs || 'vibrantes et contrastées'}, dans un style graphique ${reinforcedStyleTerms}, haute résolution, chef d'oeuvre.`;
    // Le terme `reinforcedStyleTerms` inclut maintenant le style original ET ses synonymes
    // --- FIN : MODIFICATION POUR LES SYNONYMES DE STYLE ---

    // La phrase de base du prompt incorpore maintenant backgroundClause
    const basePrompt = `Illustration détaillée et expressive ${backgroundClause} d’un personnage ${genre ? genre.toLowerCase() : 'humain'} nommé ${nom || 'sans nom'}, de type ${origine || 'mixte'}, âgé de ${age || 'vingtaine'} ans.`;

    const physicalDescription = description || 'de taille moyenne, corpulence athlétique, cheveux bruns courts et yeux clairs, avec un léger sourire aux lèvres.';
    
    // Joint les détails optionnels s'ils existent
    const optionalDetails = [
      tenue && `Il/elle porte une tenue détaillée et texturée : ${tenue}.`,
      elements && `Éléments distinctifs et remarquables : ${elements}.`,
      expression && `Il/elle adopte l’expression ou l’attitude suivante, capturée de manière dynamique : ${expression}.`
    ].filter(Boolean).join(' '); // `.filter(Boolean)` enlève les éléments `false` ou `undefined`

    return `${basePrompt} Il/elle présente la description physique suivante : ${physicalDescription}. ${optionalDetails} ${finalStyling}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- DÉBUT : VÉRIFICATION ET INCÉMENTATION DU COMPTEUR DANS handleSubmit ---
    // Vérification de la limite AVANT de lancer la génération
    if (dailyGenerations >= MAX_DAILY_GENERATIONS) {
      setError(`Vous avez atteint la limite de ${MAX_DAILY_GENERATIONS} générations par jour.`);
      return; // Empêche l'exécution du reste de la fonction
    }
    // --- FIN : VÉRIFICATION DE LA LIMITE ---

    const prompt = generatePrompt();
    setLoading(true);
    setError(null);
    setGeneratedImage(null); // Réinitialise l'image générée avant une nouvelle requête

    try {
      console.log('Prompt envoyé :', prompt);
      const response = await fetch('https://generateur-backend.onrender.com/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API : ${response.statusText}`);
      }

      const data = await response.json();
      setGeneratedImage(data.imageBase64);

      // --- DÉBUT : INCÉMENTATION DU COMPTEUR APRÈS UNE GÉNÉRATION RÉUSSIE ---
      const newCount = dailyGenerations + 1;
      setDailyGenerations(newCount); // Met à jour l'état React
      localStorage.setItem('dailyGenerationsCount', newCount.toString()); // Met à jour localStorage
      // --- FIN : INCÉMENTATION DU COMPTEUR ---

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer le téléchargement
  const handleDownload = () => {
    if (generatedImage) {
      // Créer un nom de fichier unique ou basé sur le nom du personnage
      const filename = `personnage-${form.nom.replace(/\s+/g, '-') || 'genere'}.png`;
      
      // Créer un élément 'a' temporaire
      const link = document.createElement('a');
      link.href = generatedImage; // L'image base64 est directement l'URL
      link.download = filename; // Nom de fichier pour le téléchargement
      document.body.appendChild(link); // Ajouter au DOM (nécessaire pour Firefox)
      link.click(); // Simuler un clic
      document.body.removeChild(link); // Supprimer l'élément
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
     
      {/* 1. HEADER */}
      <header className="flex flex-col items-center justify-center py-8 px-4 shadow-md w-full">
          <a href="https://imaginaires.substack.com/" className="mb-4"> {/* Mettez votre URL ici, et mb-4 pour la marge inférieure */}
        <img
          src="/images/imaginaires-logo.jpg"
          alt="Logo Imaginaires Newsletter"
          className="w-32 h-32 object-contain mb-4 rounded-full"
        />
        </a>
        <h1 className="text-5xl font-extrabold text-white text-center mb-6">
          Visualisez vos personnages
        </h1>
        <p className="text-lg text-white text-center max-w-2xl">
          De tout temps, les artistes se sont inspirés du réel pour donner vie à leur oeuvres, récits et personnages. Le poète avait sa muse, le peintre son modèle, l'écrivain le monde qui l'entourait et sa propre imagination. S'il n'est pas question d'utiliser l'Intelligence Artificielle pour écrire à votre place... Celle-ci peut cependant vous aider à mieux visualiser vos personnages !
        </p>
      </header>
      
      {/* 2. NOUVELLE SECTION : GALERIE D'IMAGES STATIQUE */}
      <div className="w-full flex flex-col items-center py-10 px-[80px]">
        <h2 className="text-xl font-bold mb-8 text-white">Exemples de générations</h2>
        {/* Le conteneur de la grille qui définit les colonnes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl"> {/* Grille de 3 colonnes sur grand écran, 2 sur moyen, 1 sur petit */}
          {images.map((imagePath, index) => (
            <div key={index} className="flex justify-center items-center"> {/* Centrer chaque image dans sa cellule de grille */}
              <img
                src={imagePath}
                alt={`Exemple ${index + 1}`}
                // Utilisation de w-full et h-auto pour que l'image remplisse sa div tout en conservant son ratio
                className="w-full h-auto object-cover rounded-lg border border-[#ddce9d] shadow-lg mb-6"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION : FORMULAIRE */}
      <div className="w-full flex justify-center py-10 px-[80px]">
          <form onSubmit={handleSubmit} className="w-1/2 space-y-6">
            <h1 className="text-3xl font-bold mb-6">À quoi ressemble votre personnage</h1>

{/* --- DÉBUT : CHOIX DU TYPE DE FOND --- */}
            <div className="mb-6">
                <label className="block font-bold mb-2">Type de fond</label>
                <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio text-[#ddce9d] h-4 w-4"
                            name="backgroundType"
                            value="white"
                            checked={backgroundType === 'white'}
                            onChange={() => setBackgroundType('white')}
                        />
                        <span className="ml-2 text-white">Fond blanc</span>
                    </label>
                    <label className="inline-flex items-center">
                        <input
                            type="radio"
                            className="form-radio text-[#ddce9d] h-4 w-4"
                            name="backgroundType"
                            value="context"
                            checked={backgroundType === 'context'}
                            onChange={() => setBackgroundType('context')}
                        />
                        <span className="ml-2 text-white">En contexte</span>
                    </label>
                </div>
            </div>
            {/* --- FIN : CHOIX DU TYPE DE FOND --- */}

            {/* --- DÉBUT : CHAMP DE CONTEXTE (AFFICHÉ CONDITIONNELLEMENT) --- */}
            {backgroundType === 'context' && (
                <div className="mb-6">
                    <label htmlFor="contextPrompt" className="block font-bold mb-1">
                        Décrivez le contexte (lieu, ambiance, époque...)
                    </label>
                    <textarea
                        id="contextPrompt"
                        name="contextPrompt"
                        value={contextPrompt}
                        onChange={(e) => setContextPrompt(e.target.value)}
                        rows={3}
                        className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
                        placeholder="Ex: Dans une ruelle sombre de Londres victorien, sous une pluie battante et des lampadaires à gaz, ambiance mystérieuse."
                    />
                </div>
            )}
            {/* --- FIN : CHAMP DE CONTEXTE --- */}

            {[
              { label: 'Prénom', name: 'nom', type: 'text', placeholder: 'Ex: Elara Veldon' },
              { label: 'Description physique', name: 'description', type: 'textarea', placeholder: 'Ex: Cheveux longs et argentés tressés, yeux vert émeraude, cicatrice fine sur la joue gauche, corpulence élancée.' },
              { label: 'Tenue vestimentaire', name: 'tenue', type: 'text', placeholder: 'Ex: Armure de cuir sombre ornée de motifs celtiques, avec une cape rouge déchirée.' },
              { label: 'Éléments distinctifs', name: 'elements', type: 'text', placeholder: 'Ex: Un collier en dent de dragon, une épée gravée à la garde complexe, des gants sans doigts.' },
              { label: 'Expression ou attitudes', name: 'expression', type: 'text', placeholder: 'Ex: Regard déterminé et stoïque, posture de combat prête à l\'action.' },
            ].map(({ label, name, type, placeholder }) => (
              <div key={name}>
                <label htmlFor={name} className="block font-bold mb-1">{label}</label>
                {type === 'textarea' ? (
                  <textarea
                    id={name}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
                    placeholder={placeholder}
                  />
                ) : (
                  <input
                    type={type}
                    id={name}
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
                    placeholder={placeholder}
                  />
                )}
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="genre" className="block font-bold mb-1">Genre</label>
                <select
                  id="genre"
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
                >
                  <option value=""disabled>-- Choisir --</option>
                  <option>Masculin</option>
                  <option>Féminin</option>
                  <option>Non Binaire</option>
                  <option>Neutre</option>
                </select>
              </div>

              <div>
                <label htmlFor="age" className="block font-bold mb-1">Âge</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="origine" className="block font-bold mb-1">Origine / Peuple</label>
              <select
                id="origine"
                name="origine"
                value={form.origine}
                onChange={handleChange}
                className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
              >
                <option value=""disabled>-- Choisir --</option>
                <option>Caucasien</option>
                <option>Noir</option>
                <option>Asiatique</option>
                <option>Indien</option>
                <option>Viking</option>
                <option>Elfe</option>
                <option>Nain</option>
                <option>Orc</option>
                <option>Géant</option>
                <option>Dragon</option>
                <option>Gnome</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="couleurs" className="block font-bold mb-1">Styles de couleurs</label>
                <select
                  id="couleurs"
                  name="couleurs"
                  value={form.couleurs}
                  onChange={handleChange}
                  className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
                >
                  <option value=""disabled>-- Choisir --</option>
                  <option>Tons chauds</option>
                  <option>Tons froids</option>
                  <option>Pastel</option>
                  <option>Noir et Blanc</option>
                </select>
              </div>

              <div>
                <label htmlFor="style" className="block font-bold mb-1">Style graphique</label>
                <select
                  id="style"
                  name="style"
                  value={form.style}
                  onChange={handleChange}
                  className="w-full bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none mb-6"
                >
                  <option value=""disabled>-- Choisir --</option>
                  <option>Fantasy</option>
                  <option>Réaliste</option>
                  <option>Cartoon</option>
                  <option>Manga</option>
                  <option>Aquarelle</option>
                  <option>Dessin au crayon</option>
                </select>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center text-yellow-300">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2">Génération en cours…</p> {/* AJOUTÉ : P pour le texte de base */}
                <p className="text-sm text-gray-400 text-center mt-2"> {/* NOUVEAU MESSAGE */}
                  (Version Bêta : les visuels peuvent parfois différer du prompt. Merci de votre compréhension !)
                </p>
              </div>
            )}
            {error && <p className="text-red-500">Erreur : {error}</p>}

             {/* --- DÉBUT : AFFICHAGE DU COMPTEUR DE GÉNÉRATION --- */}
            {/* On l'affiche seulement si on n'est pas en train de charger et s'il n'y a pas d'erreur */}
            {!loading && !error && (
              <p className="text-sm text-gray-400 text-center mt-2">
                Générations restantes aujourd'hui : {MAX_DAILY_GENERATIONS - dailyGenerations} / {MAX_DAILY_GENERATIONS}
              </p>
            )}
            {/* --- FIN : AFFICHAGE DU COMPTEUR DE GÉNÉRATION --- */}

            <button
              type="submit"
              className="w-full bg-[#ddce9d] text-black font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition mt-10"
              disabled={loading || dailyGenerations >= MAX_DAILY_GENERATIONS}
            >
              Générer l'image
            </button>
          </form>
      </div>

      {/* 4. NOUVELLE SECTION : AFFICHAGE DE L'IMAGE GÉNÉRÉE (SOUS LE FORMULAIRE) */}
      {generatedImage && ( // N'affiche cette section que si une image a été générée
        <div className="w-full flex flex-col items-center py-10 px-[80px]">
          <h2 className="text-4xl font-bold mb-8 text-white">Votre personnage généré</h2>
          <img
            src={generatedImage}
            alt="Personnage généré par l'IA"
            className="max-w-full max-h-[650px] rounded-lg border border-[#ddce9d] shadow-lg"
          />
          {/* Bouton de téléchargement */}
          <button
            onClick={handleDownload}
            className="bg-[#ddce9d] text-black font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition"
          >
            Télécharger l'image
          </button>
        </div>
      )}
    </div>
  );
}

export default App;