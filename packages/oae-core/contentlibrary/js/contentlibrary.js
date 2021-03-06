/*!
 * Copyright 2014 Apereo Foundation (AF) Licensed under the
 * Educational Community License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License. You may
 * obtain a copy of the License at
 *
 *     http://opensource.org/licenses/ECL-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS IS"
 * BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

define(['jquery', 'oae.core', 'jquery.history'], function($, oae) {

    return function(uid, showSettings, widgetData) {

        // The widget container
        var $rootel = $('#' + uid);

        // Variables that will be used to keep track of the infinite scroll instances for content items and folders
        var contentInfinityScroll = false;
        var foldersInfinityScroll = false;

        /**
         * Initialize a new infinite scroll container that fetches the content in the current library.
         * This will detect when a search is happening and will change the endpoint accordingly.
         */
        var getContent = function() {
            // Disable the previous infinite scroll
            if (contentInfinityScroll) {
                contentInfinityScroll.kill();
            }

            // Detect whether or not we need to do a search by checking if
            // the History.js state has a query parameter
            var query = History.getState().data.query;
            $('.oae-list-header-search-query', $rootel).val(query);

            var url = '/api/content/library/' + widgetData.context.id;
            if (query) {
                url = '/api/search/content-library/' + widgetData.context.id;
            }

            // Set up the list actions
            var initialContent = null;
            if ((widgetData.canAdd || widgetData.canManage) && !query) {
                initialContent = oae.api.util.template().render($('#contentlibrary-content-list-actions-template', $rootel));
            }

            // Set up the infinite scroll for the content in the library
            contentInfinityScroll = $('#contentlibrary-content .oae-list', $rootel).infiniteScroll(url, {
                'limit': 12,
                'q': query
            }, '#contentlibrary-content-template', {
                'initialContent': initialContent,
                'postProcessor': function(data) {
                    // Let the template know whether or not the current list
                    // is a main list or a search list, as different paging
                    // keys need to be provided for each
                    data.query = query;
                    data.displayOptions = {
                        'showCheckbox': true
                    };
                    return data;
                },
                'emptyListProcessor': function() {
                    oae.api.util.template().render($('#contentlibrary-content-noresults-template', $rootel), {
                        'query': query
                    }, $('#contentlibrary-content .oae-list', $rootel));
                }
            });
        };

        /**
         * Initialize a new infinite scroll container that fetches the folders in the current library.
         * This will detect when a search is happening and will change the endpoint accordingly.
         */
        var getFolders = function() {
            // Disable the previous infinite scroll
            if (foldersInfinityScroll) {
                foldersInfinityScroll.kill();
            }

            // Detect whether or not we need to do a search by checking if
            // the History.js state has a query parameter
            var query = History.getState().data.query;
            $('.oae-list-header-search-query', $rootel).val(query);

            var url = '/api/folder/library/' + widgetData.context.id;
            if (query) {
                url = '/api/search/folder-library/' + widgetData.context.id;
            }

            // Set up the list actions
            var initialContent = null;
            if ((widgetData.canAdd || widgetData.canManage) && !query) {
                initialContent = oae.api.util.template().render($('#contentlibrary-folders-list-actions-template', $rootel));
            }

            // Set up the infinite scroll for the content in the library
            foldersInfinityScroll = $('#contentlibrary-folders .oae-list', $rootel).infiniteScroll(url, {
                'limit': 12,
                'q': query
            }, '#contentlibrary-folders-template', {
                'initialContent': initialContent,
                'postProcessor': function(data) {
                    // Let the template know whether or not the current list
                    // is a main list or a search list, as different paging
                    // keys need to be provided for each
                    data.query = query;
                    data.displayOptions = {
                        'showCheckbox': true
                    };
                    return data;
                },
                'emptyListProcessor': function() {
                    oae.api.util.template().render($('#contentlibrary-folders-noresults-template', $rootel), {
                        'query': query
                    }, $('#contentlibrary-folders .oae-list', $rootel));
                }
            });
        };

        /**
         * If the current user is an anonymous user, we don't show any actions. If the user
         * is logged in, we render the list of available actions based on whether or not the
         * user can manage this library.
         */
        var setUpListHeader = function() {
            // Determine which list header actions should be available to the user viewing the library
            var listHeaderActions = [];
            if (!oae.data.me.anon) {
                // If the user is logged in, they have the option to share the content items and folders
                // and add the content items to folders
                listHeaderActions.push({
                    'icon': 'fa-share-square-o',
                    'label': oae.api.i18n.translate('__MSG__SHARE__'),
                    'trigger': 'oae-trigger-share',
                    'data': {'resourceType': 'content'}
                }, {
                    'icon': 'fa-share-square-o',
                    'label': oae.api.i18n.translate('__MSG__SHARE__'),
                    'trigger': 'oae-trigger-share',
                    'data': {'resourceType': 'folder'}
                }, {
                    'icon': 'fa-folder-open',
                    'label': oae.api.i18n.translate('__MSG__ADD_TO_FOLDER__'),
                    'trigger': 'oae-trigger-addtofolder'
                });

                if (widgetData.canManage) {
                    // If the user is the manager of the library, they have the option to delete content items and folders
                    listHeaderActions.push({
                        'icon': 'fa-trash-o',
                        'label': oae.api.i18n.translate('__MSG__DELETE__'),
                        'trigger': 'oae-trigger-deleteresources',
                        'data': {'resourceType': 'content'}
                    }, {
                        'icon': 'fa-trash-o',
                        'label': oae.api.i18n.translate('__MSG__DELETE__'),
                        'trigger': 'oae-trigger-deleteresources',
                        'data': {'resourceType': 'folder'}
                    });
                }
            }

            oae.api.util.template().render($('#contentlibrary-list-header-template', $rootel), {'actions': listHeaderActions}, $('#contentlibrary-list-header', $rootel));
        };

        /**
         * Load the list of content items or the list of folders in the current library, depending on the
         * current History.js state. This will also take care of displaying the appropriate list header
         * action buttons
         */
        var loadList = function() {
            // Ensure that all list items are unchecked
            $('.oae-list-selectall', $rootel).prop('checked', false);
            //
            // Extract the list that should be loaded based on what's encoded
            // in the History.js state
            var widgetPath = History.getState().data.widgetPath || 'content';

            // Make the appropriate tab active and show the corresponding list
            $('.nav.nav-tabs > li', $rootel).removeClass('active');
            $('.tab-content > .tab-pane', $rootel).removeClass('active');
            $('#contentlibrary-tab-' + widgetPath, $rootel).addClass('active');
            $('#contentlibrary-' + widgetPath, $rootel).addClass('active');

            // Load the correct list and show the correct list header action buttons
            $('.oae-list-header-actions > button', $rootel).hide();
            if (widgetPath === 'folders') {
                $('.oae-list-header-actions .oae-trigger-share[data-resourceType=folder]', $rootel).show();
                $('.oae-list-header-actions .oae-trigger-deleteresources[data-resourceType=folder]', $rootel).show();
                getFolders();
            } else {
                $('.oae-list-header-actions .oae-trigger-share[data-resourceType=content]', $rootel).show();
                $('.oae-list-header-actions .oae-trigger-addtofolder', $rootel).show();
                $('.oae-list-header-actions .oae-trigger-deleteresources[data-resourceType=content]', $rootel).show();
                getContent();
            }
        };

        /**
         * Add the different event bindings
         */
        var addBinding = function() {
            // Listen to History.js state changes
            $(window).on('statechange', function() {
                if ($rootel.is(':visible')) {
                    // Reload the selected list
                    loadList();
                }
            });

            // Update the page URL when a tab is clicked
            $('a[data-toggle="tab"]', $rootel).on('shown.bs.tab', function(ev) {
                // Push the new widget path to a new History.js state. We make sure to take the
                // existing state data parameters with us and construct a new URL based on
                // the existing base URL, allowing for page refreshing and bookmarking
                var newState = $.extend({}, History.getState().data, {
                    'widgetPath': $(ev.target).attr('data-type'),
                    'query': ''
                });
                var url = History.getState().data.basePath + '/' + newState.widgetPath;
                History.pushState(newState, $('title').text(), url);
            });

            // Reload the content library when new content has been added. The content
            // library will only be reloaded when the content pane is currently active
            $(window).on('done.addcontent.oae', function() {
                if ($rootel.is(':visible') && $('.nav-tabs li.active a[data-type="content"]', $rootel).length) {
                    getContent();
                }
            });

            // Reload the content library when content items or folders have been removed.
            // The list will only be reloaded for the currently active tab
            $(window).on('oae.deleteresources.done', function() {
                if ($rootel.is(':visible')) {
                    if ($('.nav-tabs li.active a[data-type="content"]', $rootel).length) {
                        getContent();
                    } else if ($('.nav-tabs li.active a[data-type="folders"]', $rootel).length) {
                        getFolders();
                    }
                }
            });
        };

        addBinding();
        setUpListHeader();
        loadList();

    };
});
