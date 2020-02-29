/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * Adds a set of mock Meals to the Cloud Firestore.
 */
FriendlyEats.prototype.addMockMeals = function() {
  var promises = [];

  for (var i = 0; i < 20; i++) {
    var name =
        this.getRandomItem(this.data.words) +
        ' ' +
        this.getRandomItem(this.data.words);
    var category = this.getRandomItem(this.data.categories);
    var photoID = Math.floor(Math.random() * 22) + 1;
    var photo = 'https://storage.googleapis.com/firestorequickstarts.appspot.com/food_' + photoID + '.png';
    var calories = Math.floor(Math.random() * 1000) + 1;
    var date = firebase.firestore.Timestamp.now();
    var protein = Math.floor(Math.random() * 50) + 1;
    var carbs = Math.floor(Math.random() * 50) + 1;
    var fat = Math.floor(Math.random() * 50) + 1;
    var ingredients = this.getMockIngredients();

    var promise = this.addMeal({
      name: name,
      category: category,
      date: date,
      photo: photo,
      nutritionFacts: {
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat
      },
      ingredients: ingredients,
    });

    if (!promise) {
      alert('addMeal() is not implemented yet!');
      return Promise.reject();
    } else {
      promises.push(promise);
    }
  }

  return Promise.all(promises);
};

/**
 * Adds a set of mock Calories to the given Meal.
 */
FriendlyEats.prototype.getMockIngredients = function() {
  var ingredients = [];
  for (var r = 0; r < 10*Math.random(); r++) {
    var ingredient = this.data.ingredients[
      parseInt(this.data.ingredients.length*Math.random())
    ];
    ingredients.push(ingredient);
  }
  return ingredients;
};

FriendlyEats.prototype.data = {
  words: [
    'Bar',
    'Fire',
    'Grill',
    'Drive Thru',
    'Place',
    'Best',
    'Spot',
    'Prime',
    'Eatin\''
  ],
  categories: [
    'Mains',
    'Sides',
    'Salads',
    'Desserts',
    'Flatbread/Pizzas',
    'Soups/Broths',
  ],
  ingredients: [
    'Beef',
    'Chicken',
    'Pork',
    'Tofu',
    'Lettuce',
    'Tomato',
    'Onion',
    'Flour',
    'Sugar',
  ],
};