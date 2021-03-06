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

define(['jquery', 'oae.core'], function($, oae) {

    return function(uid, showSettings, widgetData) {

        // The widget container
        var $rootel = $('#' + uid);

        /**
         * Render the discussion topic
         */
        var renderDiscussionTopic = function(topic) {
            $('#discussion-topic', $rootel).html(oae.api.util.security().encodeMarkdownForHTMLWithLinks(topic));
            $('#discussion-topic-container', $rootel).show();
        };

        /**
         * Initialize the discussion topic and add a binding for topic updates
         */
        var initDiscussion = function() {
            if (widgetData.description) {
                renderDiscussionTopic(widgetData.description);
            }

            $(document).on('oae.editdiscussion.done', function(ev, data) {
                renderDiscussionTopic(data.description);
            });
        };

        initDiscussion();
    };
});
