/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

FriendlyEats.ID_CONSTANT = 'fir-';

FriendlyEats.prototype.initTemplates = function() {
  this.templates = {};

  var that = this;
  document.querySelectorAll('.template').forEach(function(el) {
    that.templates[el.getAttribute('id')] = el;
  });
};

FriendlyEats.prototype.viewList = function(filters, filter_description) {
  if (!filter_description) {
    filter_description = 'any type of food with any calories.';
  }

  var mainEl = this.renderTemplate('main-adjusted');
  var headerEl = this.renderTemplate('header-base', {
    hasSectionHeader: true
  });

  this.replaceElement(
    headerEl.querySelector('#section-header'),
    this.renderTemplate('filter-display', {
      filter_description: filter_description,
      username: firebase.auth().currentUser.email
    })
  );

  this.replaceElement(document.querySelector('.header'), headerEl);
  this.replaceElement(document.querySelector('main'), mainEl);

  var that = this;
  headerEl.querySelector('#show-filters').addEventListener('click', function() {
    that.dialogs.filter.show();
  });
  headerEl.querySelector('#add-meal').addEventListener('click', function() {
    console.log("Got add-meal click");
    that.addMockMeal();
  });
  headerEl.querySelector('#sign-in').addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      that.rerender();
    }).catch(function(error) {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log(err);
    });
  });

  var renderResults = function(doc) {
    if (!doc) {
      var headerEl = that.renderTemplate('header-base', {
        hasSectionHeader: true
      });

      var noResultsEl = that.renderTemplate('no-results');

      that.replaceElement(
        headerEl.querySelector('#section-header'),
        that.renderTemplate('filter-display', {
          filter_description: filter_description
        })
      );

      headerEl.querySelector('#show-filters').addEventListener('click', function() {
        that.dialogs.filter.show();
      });

      that.replaceElement(document.querySelector('.header'), headerEl);
      that.replaceElement(document.querySelector('main'), noResultsEl);
      return;
    }
    var data = doc.data();
    data['.id'] = doc.id;
    data['go_to_meal'] = function() {
      that.router.navigate('/meals/' +  data.userId + '/' + doc.id);
    };

    // check if meal card has already been rendered
    var existingMealCardEl = mainEl.querySelector('#' + that.ID_CONSTANT + doc.id);
    var el = existingMealCardEl || that.renderTemplate('meal-card', data);

    var nutritionFactsEl = el.querySelector('.nutritionFacts');

    // clear out existing nutrition facts if they already exist
    if (existingMealCardEl) {
      nutritionFactsEl.innerHTML = '';
    }

    nutritionFactsEl.append(that.renderCalories(data.nutritionFacts.calories));

    if (!existingMealCardEl) {
      mainEl.querySelector('#cards').append(el);
    }
  };

  if (filters.meal_type || filters.category || filters.users || filters.sort !== 'Date' ) {
    this.getFilteredMeals({
      meal_type: filters.meal_type || 'Any',
      category: filters.category || 'Any',
      users: filters.users || 'Any',
      sort: filters.sort
    }, renderResults);
  } else {
    console.log("getAllPublishedMeals");
    this.getAllPublishedMeals(renderResults);
  }

  var toolbar = mdc.toolbar.MDCToolbar.attachTo(document.querySelector('.mdc-toolbar'));
  toolbar.fixedAdjustElement = document.querySelector('.mdc-toolbar-fixed-adjust');

  mdc.autoInit();
};

FriendlyEats.prototype.initReviewDialog = function() {
  var dialog = document.querySelector('#dialog-add-review');
  this.dialogs.add_review = new mdc.dialog.MDCDialog(dialog);

  var that = this;
  this.dialogs.add_review.listen('MDCDialog:accept', function() {
    var pathname = that.getCleanPath(document.location.pathname);
    var id = pathname.split('/')[2];

    that.addRating(id, {
      rating: rating,
      text: dialog.querySelector('#text').value,
      userName: 'Anonymous (Web)',
      timestamp: new Date(),
      userId: firebase.auth().currentUser.uid
    }).then(function() {
      that.rerender();
    });
  });

  var rating = 0;

  dialog.querySelectorAll('.star-input i').forEach(function(el) {
    var rate = function() {
      var after = false;
      rating = 0;
      [].slice.call(el.parentNode.children).forEach(function(child) {
        if (!after) {
          rating++;
          child.innerText = 'star';
        } else {
          child.innerText = 'star_border';
        }
        after = after || child.isSameNode(el);
      });
    };
    el.addEventListener('mouseover', rate);
  });
};

FriendlyEats.prototype.initFilterDialog = function() {
  // TODO: Reset filter dialog to init state on close.
  this.dialogs.filter = new mdc.dialog.MDCDialog(document.querySelector('#dialog-filter-all'));

  var that = this;
  this.dialogs.filter.listen('MDCDialog:accept', function() {
    that.updateQuery(that.filters);
  });

  var dialog = document.querySelector('aside');
  var pages = dialog.querySelectorAll('.page');

  this.replaceElement(
    dialog.querySelector('#meal_type-list'),
    that.renderTemplate('item-list', { items: ['Any'].concat(that.data.meal_types) })
  );

  this.replaceElement(
    dialog.querySelector('#category-list'),
    that.renderTemplate('item-list', { items: ['Any'].concat(that.data.categories) })
  );

  this.replaceElement(
    dialog.querySelector('#users-list'),
    that.renderTemplate('item-list', { items: ['Any'].concat(that.data.users) })
  );

  var renderAllList = function() {
    that.replaceElement(
      dialog.querySelector('#all-filters-list'),
      that.renderTemplate('all-filters-list', that.filters)
    );

    dialog.querySelectorAll('#page-all .mdc-list-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var id = el.id.split('-').slice(1).join('-');
        console.log(id);
        displaySection(id);
      });
    });
  };

  var displaySection = function(id) {
    if (id === 'page-all') {
      renderAllList();
    }

    pages.forEach(function(sel) {
      if (sel.id === id) {
        sel.style.display = 'block';
      } else {
        sel.style.display = 'none';
      }
    });
  };

  pages.forEach(function(sel) {
    var type = sel.id.split('-')[1];
    if (type === 'all') {
      return;
    }

    sel.querySelectorAll('.mdc-list-item').forEach(function(el) {
      el.addEventListener('click', function() {
        that.filters[type] = el.innerText.trim() === 'Any'? '' : el.innerText.trim();
        displaySection('page-all');
      });
    });
  });

  displaySection('page-all');
  dialog.querySelectorAll('.back').forEach(function(el) {
    el.addEventListener('click', function() {
      displaySection('page-all');
    });
  });
};

FriendlyEats.prototype.updateQuery = function(filters) {
  var query_description = '';

  if (filters.users !== '') {
    query_description += 'your';
  } else {
    query_description += 'public';
  }

  if (filters.meal_type !== '') {
    query_description += ' ' + filters.meal_type;
  } else {
    query_description += ' meals';
  }

  if (filters.category !== '') {
    query_description += ' that is a ' + filters.category;
  } else {
    query_description += ' of any kind of food';
  }

  if (filters.sort === 'Calories') {
    query_description += ' sorted by Calories';
  } else if (filters.sort === 'Date') {
    query_description += ' sorted by Date';
  }

  this.viewList(filters, query_description);
};

FriendlyEats.prototype.viewMeal = function(userId, id) {
  var sectionHeaderEl;
  var that = this;

  return this.getMeal(userId, id)
    .then(function(doc) {
      var data = doc.data();
      var dialog =  that.dialogs.add_review;

      data.publish_meal = function() {
        that.publishMeal(userId, id);
        dialog.show();
      };

      sectionHeaderEl = that.renderTemplate('meal-header', data);

      return doc.ref.collection('ingredients').get();
    })
    .then(function(ingredients) {
      var mainEl;

      if (ingredients.size) {
        mainEl = that.renderTemplate('main');
        mainEl.querySelector('#cards').append(that.renderTemplate('ingredients-header'));
        ingredients.forEach(function(ingredient) {
          var data = ingredient.data();
          data['go_to_food'] = function() {
            that.router.navigate('/foods/' + data.food_id);
          }
          var el = that.renderTemplate('review-card', data);

          mainEl.querySelector('#cards').append(el);
        })
      }

      var headerEl = that.renderTemplate('header-base', {
        hasSectionHeader: true
      });

      that.replaceElement(document.querySelector('.header'), sectionHeaderEl);
      that.replaceElement(document.querySelector('main'), mainEl);
    })
    .then(function() {
      that.router.updatePageLinks();
    })
    .catch(function(err) {
      console.warn('Error rendering page', err);
    });
};

FriendlyEats.prototype.viewFood = function(id) {
  var sectionHeaderEl;
  var that = this;

  return this.getFood(id)
    .then(function(doc) {
      var data = doc.data();

      sectionHeaderEl = that.renderTemplate('meal-header', data);

      var mainEl;
      mainEl = that.renderTemplate('main');

      data.details = "One day we'll have micronutrients here";
      var el = that.renderTemplate('details-card', data);
      var calIconEl = el.querySelector('.calories_icon');
      calIconEl.append(that.renderCalories(data.nutritionFacts.calories));
      var carbIconEl = el.querySelector('.carbs_icon');
      carbIconEl.append(that.renderCarbs(data.nutritionFacts.carbs));
      var proteinIconEl = el.querySelector('.protein_icon');
      proteinIconEl.append(that.renderProtein(data.nutritionFacts.protein));
      var fatIconEl = el.querySelector('.fat_icon');
      fatIconEl.append(that.renderFat(data.nutritionFacts.fat));

      mainEl.querySelector('#cards').append(el);

      var headerEl = that.renderTemplate('header-base', {
        hasSectionHeader: true
      });

      that.replaceElement(document.querySelector('.header'), sectionHeaderEl);
      that.replaceElement(document.querySelector('main'), mainEl);
    })
    .then(function() {
      that.router.updatePageLinks();
    })
    .catch(function(err) {
      console.warn('Error rendering page', err);
    });
};

FriendlyEats.prototype.renderTemplate = function(id, data) {
  var template = this.templates[id];
  var el = template.cloneNode(true);
  el.removeAttribute('hidden');
  this.render(el, data);
  
  // set an id in case we need to access the element later
  if (data && data['.id']) {
    // for `querySelector` to work, ids must start with a string
    el.id = this.ID_CONSTANT + data['.id'];
  }

  return el;
};

FriendlyEats.prototype.render = function(el, data) {
  if (!data) {
    return;
  }

  var that = this;
  var modifiers = {
    'data-fir-foreach': function(tel) {
      var field = tel.getAttribute('data-fir-foreach');
      var values = that.getDeepItem(data, field);

      values.forEach(function (value, index) {
        var cloneTel = tel.cloneNode(true);
        tel.parentNode.append(cloneTel);

        Object.keys(modifiers).forEach(function(selector) {
          var children = Array.prototype.slice.call(
            cloneTel.querySelectorAll('[' + selector + ']')
          );
          children.push(cloneTel);
          children.forEach(function(childEl) {
            var currentVal = childEl.getAttribute(selector);

            if (!currentVal) {
              return;
            }

            childEl.setAttribute(
              selector,
              currentVal.replace('~', field + '/' + index)
            );
          });
        });
      });

      tel.parentNode.removeChild(tel);
    },
    'data-fir-content': function(tel) {
      var field = tel.getAttribute('data-fir-content');
      tel.innerText = that.getDeepItem(data, field);
    },
    'data-fir-click': function(tel) {
      tel.addEventListener('click', function() {
        var field = tel.getAttribute('data-fir-click');
        that.getDeepItem(data, field)();
      });
    },
    'data-fir-if': function(tel) {
      var field = tel.getAttribute('data-fir-if');
      if (!that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-if-not': function(tel) {
      var field = tel.getAttribute('data-fir-if-not');
      if (that.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-attr': function(tel) {
      var chunks = tel.getAttribute('data-fir-attr').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      tel.setAttribute(attr, that.getDeepItem(data, field));
    },
    'data-fir-style': function(tel) {
      var chunks = tel.getAttribute('data-fir-style').split(':');
      var attr = chunks[0];
      var field = chunks[1];
      var value = that.getDeepItem(data, field);

      if (attr.toLowerCase() === 'backgroundimage') {
        value = 'url(' + value + ')';
      }
      tel.style[attr] = value;
    }
  };

  var preModifiers = ['data-fir-foreach'];

  preModifiers.forEach(function(selector) {
    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });

  Object.keys(modifiers).forEach(function(selector) {
    if (preModifiers.indexOf(selector) !== -1) {
      return;
    }

    var modifier = modifiers[selector];
    that.useModifier(el, selector, modifier);
  });
};

FriendlyEats.prototype.useModifier = function(el, selector, modifier) {
  el.querySelectorAll('[' + selector + ']').forEach(modifier);
};

FriendlyEats.prototype.getDeepItem = function(obj, path) {
  path.split('/').forEach(function(chunk) {
    obj = obj[chunk];
  });
  return obj;
};

FriendlyEats.prototype.renderCalories = function(calories) {
  var el = this.renderTemplate('calories', {});
  for (var r = 0; r < 5; r += 1) {
    var icon;
    if (r < Math.floor(calories) / 100) {
      icon = this.renderTemplate('fire-icon', {});
      el.append(icon);
    }
  }
  return el;
};

FriendlyEats.prototype.renderProtein = function(protein) {
  var el = this.renderTemplate('calories', {});
  for (var r = 0; r < 10; r += 1) {
    var icon;
    if (r < Math.floor(protein) / 10) {
      icon = this.renderTemplate('protein-icon', {});
      el.append(icon);
    } else {
      break;
    }
  }
  return el;
};

FriendlyEats.prototype.renderCarbs = function(carbs) {
  var el = this.renderTemplate('calories', {});
  for (var r = 0; r < 10; r += 1) {
    var icon;
    if (r < Math.floor(carbs) / 10) {
      icon = this.renderTemplate('carbs-icon', {});
      el.append(icon);
    } else {
      break;
    }
  }
  return el;
};

FriendlyEats.prototype.renderFat = function(fat) {
  var el = this.renderTemplate('calories', {});
  for (var r = 0; r < 10; r += 1) {
    var icon;
    if (r < Math.floor(fat) / 10) {
      icon = this.renderTemplate('fat-icon', {});
      el.append(icon);
    } else {
      break;
    }
  }
  return el;
};

FriendlyEats.prototype.renderPrice = function(price) {
  var el = this.renderTemplate('price', {});
  for (var r = 0; r < price; r += 1) {
    el.append('$');
  }
  return el;
};

FriendlyEats.prototype.replaceElement = function(parent, content) {
  parent.innerHTML = '';
  parent.append(content);
};

FriendlyEats.prototype.rerender = function() {
  this.router.navigate(document.location.pathname + '?' + new Date().getTime());
};
