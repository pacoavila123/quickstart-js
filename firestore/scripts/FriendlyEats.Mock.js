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
  this.addMockFoods();

  var promises = [];

  for (var i = 0; i < 20; i++) {
    promises.push(this.addMockMeal());
  }

  return Promise.all(promises);
};

FriendlyEats.prototype.addMockFoods = function () {
  var that = this;
  this.data.food_names.forEach(function(name) {
    var nutritionFacts = that.getMockNutritionFacts();
    that.addFood({
       name: name,
       nutritionFacts: nutritionFacts,
     });
  });
}

FriendlyEats.prototype.addMockMeal = function () {
    var meal_type = this.getRandomItem(this.data.meal_types);
    var name = this.getRandomItem(this.data.adjectives) + ' ' + meal_type;
    var category = this.getRandomItem(this.data.categories);
    var photoID = Math.floor(Math.random() * 22) + 1;
    var photo = 'https://storage.googleapis.com/firestorequickstarts.appspot.com/food_' + photoID + '.png';
    var date = firebase.firestore.Timestamp.now();
    var nutritionFacts = this.getMockNutritionFacts();
    var that = this;
    var userId = firebase.auth().currentUser.uid;

    var promise = this.addMeal({
      name: name,
      userId: userId,
      meal_type: meal_type,
      category: category,
      date: date,
      photo: photo,
      nutritionFacts: nutritionFacts,
    })
    .then(function(docRef) {
      // TODO(pacoavila) figure out why we're getting 400 on these.
      that.addMockIngredients(docRef.id);
    });

    if (!promise) {
      alert('addMeal() is not implemented yet!');
      return Promise.reject();
    }
    return promise;
}

FriendlyEats.prototype.addMockIngredients = function(mealID) {
  var that = this;
  firebase.firestore().collection('foods').limit(5)
    .get()
    .then(function(snapshot) {
      snapshot.forEach(function(doc){
        console.log(doc.id, " => ", doc.data());
        that.addIngredient(mealID, doc);
      })
    });
}

FriendlyEats.prototype.getMockNutritionFacts = function() {
  var calories = Math.floor(Math.random() * 1000) + 1;
  var serving_size = Math.floor(Math.random() * 4) + 1;
  var protein = Math.floor(Math.random() * 50) + 1;
  var carbs = Math.floor(Math.random() * 50) + 1;
  var fat = Math.floor(Math.random() * 50) + 1;
  return {
     calories: calories,
     serving_size: serving_size,
     protein: protein,
     carbs: carbs,
     fat: fat
  };
}


FriendlyEats.prototype.data = {
  adjectives: [
    'Savory',
    'Spicy',
    'Sweet',
    'Bitter',
    'Awesome',
    'Googley',
    'Umami',
    'Healthy',
  ],
  meal_types: [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Treat',
  ],
  categories: [
    'Main',
    'Side',
    'Salad',
    'Dessert',
    'Flatbread/Pizza',
    'Soup/Broth',
  ],
  food_names: [
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