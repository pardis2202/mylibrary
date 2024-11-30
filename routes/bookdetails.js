import { Router, Route, Routes } from 'react-router-dom';
import Home from '../src/assets/components/Home';
import BookDetails from '../src/assets/components/BookDetails';
import NonFictionDetails from '../src/assets/components/NonFictionDetails';
import Nonfiction from '../src/assets/components/NonFiction';

const BookRoutes = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books/:id" element={<BookDetails />} />
      <Route path="/nonfiction" element={<Nonfiction/>}/>
      <Route path="/nonfiction/:id" element={<NonFictionDetails/>}/>
      </Routes>
    </Router>
  );
};

export default BookRoutes;
