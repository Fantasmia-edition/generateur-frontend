import React, { useState, useEffect, useRef } from 'react';

const images = [
  '/images/image1.jpg',
  '/images/image2.jpg',
  '/images/image3.jpg',
];

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

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const maxLoops = 3;
  const intervalRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generatePrompt = () => {
    const {
      nom, genre, origine, age, description,
      tenue, elements, expression, couleurs, style,
    } = form;

    return `Illustration sur fond blanc d’un personnage ${genre ? genre.toLowerCase() : '[genre non précisé]'} nommé ${nom || '[Nom inconnu]'}, de type ${origine || '[Origine inconnue]'}, âgé de ${age || '[âge inconnu]'} ans. ` +
      `Il/elle présente la description physique suivante : ${description || '[Description non précisée]'}. ` +
      `${tenue ? `Il/elle porte : ${tenue}. ` : ''}` +
      `${elements ? `Éléments distinctifs : ${elements}. ` : ''}` +
      `${expression ? `Il/elle adopte l’expression ou l’attitude suivante : ${expression}. ` : ''}` +
      `Utiliser une palette de couleurs ${couleurs || '[non précisée]'}, dans un style graphique ${style || '[non précisé]'}.`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const prompt = generatePrompt();
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

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
      // Clé modifiée ici pour coller au backend
      setGeneratedImage(data.imageBase64);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Slider automatique avec limite de boucles
  useEffect(() => {
    if (loopCount >= maxLoops) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % images.length;
        if (nextIndex === 0) {
          setLoopCount((prev) => prev + 1);
        }
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, [loopCount]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-row px-[80px] py-[80px] gap-10">

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="w-1/2 space-y-6">
        <h1 className="text-3xl font-bold mb-6">Décrivez votre personnage</h1>

        {[
          { label: 'Prénom et nom', name: 'nom', type: 'text' },
          { label: 'Description physique', name: 'description', type: 'textarea' },
          { label: 'Tenue vestimentaire (optionnel)', name: 'tenue', type: 'text' },
          { label: 'Éléments distinctifs', name: 'elements', type: 'text' },
          { label: 'Expression ou attitudes', name: 'expression', type: 'text' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label htmlFor={name} className="block font-bold mb-1">{label}</label>
            {type === 'textarea' ? (
              <textarea
                id={name}
                name={name}
                value={form[name]}
                onChange={handleChange}
                rows={3}
                className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
              />
            ) : (
              <input
                type={type}
                id={name}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
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
              className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
            >
              <option value="">-- Choisir --</option>
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
              className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 focus:outline-none hover:border-[#ddce9d]"
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
            className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
          >
            <option value="">-- Choisir --</option>
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
              className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none"
            >
              <option value="">-- Choisir --</option>
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
              className="w-1/2 bg-black text-white border border-[#ddce9d] rounded-lg px-4 py-2 hover:border-[#ddce9d] focus:outline-none mb-6"
            >
              <option value="">-- Choisir --</option>
              <option>Fantasy</option>
              <option>Réaliste</option>
              <option>Cartoon</option>
              <option>Manga</option>
              <option>Aquarelle</option>
              <option>Dessin au crayon</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-yellow-300">Génération en cours…</p>}
        {error && <p className="text-red-500">Erreur : {error}</p>}

        <button
          type="submit"
          className="w-1/2 bg-[#ddce9d] text-black font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition mt-10"
          disabled={loading}
        >
          Générer l'image
        </button>
      </form>

      {/* Affichage image générée ou slider */}
      <div className="w-1/2 flex flex-col items-center justify-center gap-8">
        {generatedImage ? (
          <img
            src={generatedImage}
            alt="Personnage généré"
            className="max-w-full max-h-[650px] rounded-lg border border-[#ddce9d]"
          />
        ) : (
          <img
            src={images[currentImageIndex]}
            alt="Image de présentation"
            className="max-w-full max-h-[650px] rounded-lg border border-[#ddce9d]"
          />
        )}
      </div>
    </div>
  );
}

export default App;
