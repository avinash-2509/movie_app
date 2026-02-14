import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import { useDebounce } from 'react-use'

import './App.css'
import Search from './components/search'
import MovieCard from './components/MovieCard'
import { getTrendingMovies, updateSearchCount } from '../appwrite'

const API_BASE_URL = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {

  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [movieList, seTMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearchTerm, setDebouncedSearchedTerm] = useState('')
  const [trendingMovies,setTrendingMovies]=useState([])


  //debounced the search term to prevent making too many API requests
  //by waiting fo rthe user to stop typing for 500 ms
  useDebounce(() => setDebouncedSearchedTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const endpoint = query ?
        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`
      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json()
      if (data.response == 'false') {
        setErrorMessage(data.Error || 'Failed to fetched movie')
        seTMovieList([]);
        return;
      }
      seTMovieList(data.results || []);
      if(query && data.results.length>0)
      {
        await updateSearchCount(query,data.results[0])
      }

    }
    catch (error) {
      console.log(`Error fetching movies: ${error}`);

    }
    finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies=async()=>{
    try{
      const movies=await getTrendingMovies();
      setTrendingMovies(movies)
    }
    catch(error)
    {

    }
  }

  useEffect(() => {
    const currentScroll = window.scrollY;
    fetchMovies(debouncedSearchTerm).then(() => {
      window.scrollTo(0, currentScroll);
    })
  }, [debouncedSearchTerm])

  useEffect(()=>{
    loadTrendingMovies()
  },[])


  return (
    <main>
      <div className='pattern' />
      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className='text-gradient'>Movies</span>
            You'll Enjoy Without the Hassel</h1>
          <Search setSearchTerm={setSearchTerm} searchTerm={searchTerm}></Search>
        </header>
        {trendingMovies.length>0 && (
          <section className='trending'>
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie,index)=>(
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt="" srcset="" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>
          <h2 className='mt-[40px]'>All movies</h2>

          {errorMessage && (
            <p className='text-red-500'>{errorMessage}</p>
          )}

          {isLoading && (
            <p className='text-white'>Loading...</p>
          )}

          <ul>
            {movieList.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </ul>
        </section>

      </div>
    </main>

  )
}

export default App
