import FavoritesList from '../../components/FavoritesList'

export default function ProfileFavorites() {
  return (
    <section aria-labelledby="fav-title">
      <h2 id="fav-title" className="section__title section__title--sm">Избранное</h2>
      <FavoritesList />
    </section>
  )
}
