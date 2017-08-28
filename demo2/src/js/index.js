/**
 * Created by jumperchen on 1/15/16.
 */
import $ from 'jquery';
import {Employee, Person} from './common/lib';
import Swiper from './common/swiper.js';
$(function() {
  console.log("index html!");
  var swiper = new Swiper('.swiper-container');
});
  console.log(new Employee('index', 'index').describe());




