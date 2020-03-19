import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from './models/Likes'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import { elements, renderLoader, clearLoader } from './views/base'


/*
Global state of the app
- search object
- current recipe object
- shopping list object
- liked recipes
*/

const state = {};
window.state = state;

//** Search controller*/
async function controlSearch(){
    // Get query from view
    const query = searchView.getInput();
    //console.log(query);

    if(query){
        // new search object and add it to state
        state.search = new Search(query);

        // prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        // search for recipe
        try{
        await state.search.getResults();

        // render results on UI
        clearLoader();
        searchView.renderResults(state.search.result);
        }catch(error){
            alert('Something went wrong!!');
            clearLoader();
        }
}
};

//** Recipe controller*/
async function controlRecipe(){
    const id = window.location.hash.replace('#', '');

    if(id){
    //prepare new UI
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //Highlight selected earch item
    if(state.search) searchView.highlightSelected(id);

    //create object
    state.recipe = new Recipe(id);

    try{
    //get recipe data
    await state.recipe.getRecipe();
    state.recipe.parseIngredients();

    //calculate servings and time
    state.recipe.calcTime();
    state.recipe.calcServing();
    
    //render recipe
    clearLoader();
    console.log(state.recipe);
    recipeView.renderRecipe(state.recipe);

    }catch(error){
        alert('Error processing the request');
    }
    }
};

//**List controller*/
function controlList(){
    
   //create a list
   if(!state.list) state.list = new List();

    //add ingredients to the list and UI
    state.recipe.ingredients.forEach(el =>{
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
})
}

//Likes controller
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;
     
    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//search results by submittig form
elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

//pagination
elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    console.log(btn);
    if(btn) {
        const gotopage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, gotopage);
        //console.log(gotopage);
    }
});

//window.addEventListener('hashchange', controlRecipe );
['hashchange'].forEach(event => window.addEventListener(event, controlRecipe));

// Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        controlList();
    }
});

//under recipe button clicks
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // Handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // Delete from state
        state.list.deleteItem(id);

        // Delete from UI
        listView.deleteItem(id);
        
        //handling the count
    }else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // Like controller
        controlLike();
    }
});

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

