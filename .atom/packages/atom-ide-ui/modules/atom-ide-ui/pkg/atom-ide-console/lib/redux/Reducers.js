"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = accumulateState;

function _immutable() {
  const data = require("immutable");

  _immutable = function () {
    return data;
  };

  return data;
}

function _collection() {
  const data = require("../../../../../nuclide-commons/collection");

  _collection = function () {
    return data;
  };

  return data;
}

function Actions() {
  const data = _interopRequireWildcard(require("./Actions"));

  Actions = function () {
    return data;
  };

  return data;
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *  strict-local
 * @format
 */
const RECORD_PROPERTIES_TO_COMPARE = ['text', 'level', 'format', 'scopeName', 'sourceId', 'kind'];

function shouldAccumulateRecordCount(recordA, recordB) {
  if (String(recordA.sourceId).toLowerCase().includes('debugger') || String(recordB.sourceId).toLowerCase().includes('debugger')) {
    return false;
  }

  const areRelevantPropertiesEqual = RECORD_PROPERTIES_TO_COMPARE.every(prop => recordA[prop] === recordB[prop]); // if data exists, we should not accumulate this into the previous record

  const doesDataExist = recordA.data || recordB.data;
  const recATags = recordA.tags;
  const recBTags = recordB.tags;
  const areTagsEqual = !recATags && !recBTags || recATags && recBTags && (0, _collection().arrayEqual)(recATags, recBTags);
  return areRelevantPropertiesEqual && !Boolean(doesDataExist) && Boolean(areTagsEqual);
}

function accumulateState(state, action) {
  switch (action.type) {
    case Actions().RECORD_RECEIVED:
      {
        const {
          record
        } = action.payload;
        let nextRecords = state.records; // check if the message is exactly the same as the previous one, if so
        // we add a count to it.

        const lastRecord = nextRecords.last();

        if (lastRecord != null && shouldAccumulateRecordCount(lastRecord, record)) {
          // Update the last record. Don't use `splice()` because that's O(n)
          const updatedRecord = Object.assign({}, lastRecord, {
            repeatCount: lastRecord.repeatCount + 1,
            timestamp: record.timestamp
          });
          nextRecords = nextRecords.pop().push(updatedRecord);
        } else {
          nextRecords = nextRecords.push(record);
        }

        if (nextRecords.size > state.maxMessageCount) {
          // We could only have gone over by one.
          nextRecords = nextRecords.shift();
        }

        return Object.assign({}, state, {
          records: nextRecords
        });
      }

    case Actions().SET_MAX_MESSAGE_COUNT:
      {
        const {
          maxMessageCount
        } = action.payload;

        if (maxMessageCount <= 0) {
          return state;
        }

        return Object.assign({}, state, {
          maxMessageCount,
          records: state.records.slice(-maxMessageCount)
        });
      }

    case Actions().REGISTER_SOURCE:
      {
        const {
          source
        } = action.payload;
        return Object.assign({}, state, {
          providers: new Map(state.providers).set(source.id, Object.assign({}, source, {
            name: source.name || source.id
          }))
        });
      }

    case Actions().CLEAR_RECORDS:
      {
        return Object.assign({}, state, {
          records: (0, _immutable().List)()
        });
      }

    case Actions().REGISTER_EXECUTOR:
      {
        const {
          executor
        } = action.payload;
        return Object.assign({}, state, {
          executors: new Map(state.executors).set(executor.id, executor)
        });
      }

    case Actions().SELECT_EXECUTOR:
      {
        const {
          executorId
        } = action.payload;
        return Object.assign({}, state, {
          currentExecutorId: executorId
        });
      }

    case Actions().REMOVE_SOURCE:
      {
        const {
          sourceId
        } = action.payload;
        const providers = new Map(state.providers);
        const providerStatuses = new Map(state.providerStatuses);
        const executors = new Map(state.executors);
        providers.delete(sourceId);
        providerStatuses.delete(sourceId);
        executors.delete(sourceId);
        return Object.assign({}, state, {
          providers,
          providerStatuses,
          executors
        });
      }

    case Actions().UPDATE_STATUS:
      {
        const {
          status,
          providerId
        } = action.payload;
        return Object.assign({}, state, {
          providerStatuses: new Map(state.providerStatuses).set(providerId, status)
        });
      }

    case Actions().EXECUTE:
      {
        const command = action.payload.code;
        return Object.assign({}, state, {
          history: state.history.concat(command).slice(-1000)
        });
      }

    case Actions().SET_CREATE_PASTE_FUNCTION:
      {
        const {
          createPasteFunction
        } = action.payload;
        return Object.assign({}, state, {
          createPasteFunction
        });
      }

    case Actions().SET_WATCH_EDITOR_FUNCTION:
      {
        const {
          watchEditor
        } = action.payload;
        return Object.assign({}, state, {
          watchEditor
        });
      }

    case Actions().SET_FONT_SIZE:
      {
        const {
          fontSize
        } = action.payload;
        return Object.assign({}, state, {
          fontSize
        });
      }
  }

  return state;
}